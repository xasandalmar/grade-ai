import "server-only";
import { z } from "zod";
import { getOpenAIClient, OPENAI_MODEL } from "./openai-client";
import type {
  ExamSummary,
  StudentStat,
  SubjectStat,
  SubjectTermTrend,
  GradeDistribution,
  DataIntegrityAlert,
} from "@/lib/analysis/exam-analytics";
import { trendDirection } from "@/lib/analysis/exam-analytics";

const aiSummarySchema = z.object({
  executiveSummary: z.string(),
  classPerformance: z.string(),
  topStudents: z.string(),
  studentsNeedingAttention: z.string(),
  strongSubjects: z.string(),
  weakSubjects: z.string(),
  subjectInsights: z.string(),
  studentPerformanceInsights: z.string(),
  termTrends: z.string(),
  dataIntegrityNotes: z.string(),
  recommendations: z.array(z.string()),
});

export type AiExamSummary = z.infer<typeof aiSummarySchema>;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    executiveSummary: { type: "string" },
    classPerformance: { type: "string" },
    topStudents: { type: "string" },
    studentsNeedingAttention: { type: "string" },
    strongSubjects: { type: "string" },
    weakSubjects: { type: "string" },
    subjectInsights: { type: "string" },
    studentPerformanceInsights: { type: "string" },
    termTrends: { type: "string" },
    dataIntegrityNotes: { type: "string" },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: [
    "executiveSummary",
    "classPerformance",
    "topStudents",
    "studentsNeedingAttention",
    "strongSubjects",
    "weakSubjects",
    "subjectInsights",
    "studentPerformanceInsights",
    "termTrends",
    "dataIntegrityNotes",
    "recommendations",
  ],
  additionalProperties: false,
} as const;

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  so: "Somali",
  ar: "Arabic",
};

export type GenerateExamSummaryInput = {
  examTitle: string;
  className: string;
  examDate: string | null;
  language: string;
  summary: ExamSummary;
  subjects: SubjectStat[];
  students: StudentStat[];
  topPerformers: StudentStat[];
  strugglingStudents: StudentStat[];
  gradeDistribution: GradeDistribution;
  termTrends: SubjectTermTrend[];
  dataIntegrityAlerts: DataIntegrityAlert[];
  /** e.g. 100 — every student's "score" below is out of this, never a sum
   * across subjects (which would read as out of 300/400 and be meaningless). */
  examMaxMark: number;
};

/**
 * Writes the narrative sections of the exam report from already-computed,
 * verified statistics. The model never sees raw marks and never computes
 * anything itself — every number here was calculated by the app/database
 * (see lib/analysis/exam-analytics.ts and the SQL views). Its only job is to
 * describe and contextualize numbers it is handed, in the requested language.
 */
export async function generateExamSummary(
  input: GenerateExamSummaryInput,
): Promise<AiExamSummary | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  const languageName = LANGUAGE_NAMES[input.language] ?? "English";

  const verifiedData = {
    exam: {
      title: input.examTitle,
      className: input.className,
      date: input.examDate,
    },
    summary: input.summary,
    subjects: input.subjects.map((s) => ({
      name: s.name,
      average: s.average,
      highest: s.highest,
      lowest: s.lowest,
      passRate: s.pass_rate,
      maxMark: s.max_mark,
    })),
    examMaxMark: input.examMaxMark,
    gradeDistribution: input.gradeDistribution,
    topPerformers: input.topPerformers.map((s) => ({
      name: s.full_name,
      rank: s.rank,
      score: s.average,
      percentage: s.percentage,
      grade: s.grade,
    })),
    studentsNeedingAttention: input.strugglingStudents.map((s) => ({
      name: s.full_name,
      rank: s.rank,
      score: s.average,
      percentage: s.percentage,
      grade: s.grade,
    })),
    subjectTermTrends: input.termTrends.map((t) => ({
      subject: t.subjectName,
      points: t.points,
      direction: trendDirection(t),
    })),
    dataIntegrityAlerts: input.dataIntegrityAlerts.map((a) => ({
      student: a.studentName,
      missingSubjects: a.missingSubjects,
    })),
    totalStudents: input.students.length,
    totalSubjects: input.subjects.length,
  };

  const systemPrompt = [
    "You are an assistant that writes school exam analysis reports for teachers and school administrators.",
    "You will be given verified, already-computed statistics as JSON. You must ONLY describe, summarize, and give recommendations based on this data.",
    "You must NEVER invent, estimate, or alter any student name, mark, rank, statistic, or count that isn't explicitly present in the data you were given.",
    "If a field of data is empty or missing, say so plainly rather than making something up.",
    `Every student's "score" field, and summary.class_average, are already out of examMaxMark (${input.examMaxMark}) — this is the exam's real maximum, NOT a sum across every subject. Never add subject marks together yourself or describe a score as being out of any number other than examMaxMark.`,
    `Write the entire response in ${languageName}, using natural, fluent, professional wording a school administrator in that language would expect — not a literal word-for-word translation.`,
    "termTrends should specifically discuss how each subject's CAT1/CAT2/Final (or similar) component averages moved — improving, declining, or flat — using only the subjectTermTrends data given; if that array is empty, say term-by-term component data wasn't available in the uploaded sheet.",
    "dataIntegrityNotes must list which students (if any) are missing marks for which subjects, based only on dataIntegrityAlerts, and note this can affect their total/percentage since it's only computed over subjects they have a recorded mark for. If dataIntegrityAlerts is empty, state plainly that every student has a recorded mark for every subject.",
    "Keep each section to 2-5 sentences, except recommendations which should be 3-6 short, actionable bullet points.",
  ].join(" ");

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(verifiedData) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "exam_report_summary", schema: JSON_SCHEMA, strict: true },
    },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) return null;

  const parsed = aiSummarySchema.safeParse(JSON.parse(raw));
  if (!parsed.success) return null;

  return parsed.data;
}

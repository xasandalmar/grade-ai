import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  computeDataIntegrityAlerts,
  computeGradeDistribution,
  computeSubjectTermTrends,
  getStrugglingStudents,
  getTopPerformers,
  type DataIntegrityAlert,
  type ExamSummary,
  type GradeDistribution,
  type StudentStat,
  type SubjectStat,
  type SubjectTermTrend,
} from "@/lib/analysis/exam-analytics";
import { generateExamSummary, type AiExamSummary } from "@/lib/ai/generate-exam-summary";

type Supa = SupabaseClient<Database>;

export type ExamReportNumbers = {
  summary: ExamSummary | null;
  subjects: SubjectStat[];
  students: StudentStat[];
  termTrends: SubjectTermTrend[];
  gradeDistribution: GradeDistribution;
  topPerformers: StudentStat[];
  strugglingStudents: StudentStat[];
  dataIntegrityAlerts: DataIntegrityAlert[];
  /** studentId -> subjectName -> mark, for a full "one row per student, one
   * column per subject" combined mark-sheet view (a blank/missing subject is
   * simply absent from the inner map, never a fabricated 0). */
  studentSubjectMarks: Record<string, Record<string, number>>;
  /** The exam's max mark per subject (e.g. 100), taken from the subjects
   * themselves rather than hardcoded. A student's overall score is always
   * shown out of THIS number — never a sum across every subject (which would
   * read as "out of 300/400" and be meaningless outside this exam). */
  examMaxMark: number;
};

/**
 * Everything about an exam's report that's language-independent: the actual
 * numbers. Computed fresh from the live SQL views every time — never cached —
 * so it can never go stale relative to the underlying exam_results.
 */
export async function getExamReportNumbers(
  supabase: Supa,
  examId: string,
): Promise<ExamReportNumbers> {
  const [
    { data: summary },
    { data: subjectStats },
    { data: studentStats },
    { data: termStats },
    { data: resultPairs },
  ] = await Promise.all([
    supabase.from("v_exam_summary").select("*").eq("exam_id", examId).single(),
    supabase.from("v_exam_subject_stats").select("*").eq("exam_id", examId).order("name"),
    supabase.from("v_exam_student_stats").select("*").eq("exam_id", examId).order("rank"),
    supabase.from("v_exam_subject_term_stats").select("*").eq("exam_id", examId),
    supabase.from("exam_results").select("student_id, subject_id, mark").eq("exam_id", examId),
  ]);

  const students = studentStats ?? [];
  const subjects = subjectStats ?? [];
  const subjectNameById = new Map(subjects.map((s) => [s.subject_id, s.name]));

  const studentSubjectMarks: Record<string, Record<string, number>> = {};
  for (const row of resultPairs ?? []) {
    const subjectName = subjectNameById.get(row.subject_id);
    if (!subjectName) continue;
    (studentSubjectMarks[row.student_id] ??= {})[subjectName] = row.mark;
  }

  return {
    summary: summary ?? null,
    subjects,
    students,
    termTrends: computeSubjectTermTrends(termStats ?? []),
    gradeDistribution: computeGradeDistribution(students),
    topPerformers: getTopPerformers(students),
    strugglingStudents: getStrugglingStudents(students),
    dataIntegrityAlerts: computeDataIntegrityAlerts(students, subjects, resultPairs ?? []),
    studentSubjectMarks,
    examMaxMark: subjects[0]?.max_mark ?? 100,
  };
}

export type ExamMeta = {
  title: string;
  className: string;
  examDate: string | null;
};

/**
 * Returns the cached AI narrative for this exam in this language if one
 * already exists; otherwise generates it (GPT-5.6 Luna, fed only the
 * already-computed numbers above) and caches it, so switching to a language
 * is a one-time cost per exam, not a re-generation on every view.
 * Returns null (never throws) if OpenAI isn't configured or the call fails —
 * the numeric report always renders regardless.
 */
export async function getOrGenerateAiSummary(
  supabase: Supa,
  examId: string,
  schoolId: string,
  language: string,
  exam: ExamMeta,
  numbers: ExamReportNumbers,
): Promise<AiExamSummary | null> {
  const { data: existing } = await supabase
    .from("reports")
    .select("ai_summary")
    .eq("exam_id", examId)
    .eq("type", "exam")
    .eq("language", language)
    .maybeSingle();

  if (existing?.ai_summary) {
    return existing.ai_summary as AiExamSummary;
  }

  let aiSummary: AiExamSummary | null = null;
  try {
    aiSummary = await generateExamSummary({
      examTitle: exam.title,
      className: exam.className,
      examDate: exam.examDate,
      language,
      summary: numbers.summary as ExamSummary,
      subjects: numbers.subjects,
      students: numbers.students,
      topPerformers: numbers.topPerformers,
      strugglingStudents: numbers.strugglingStudents,
      gradeDistribution: numbers.gradeDistribution,
      termTrends: numbers.termTrends,
      dataIntegrityAlerts: numbers.dataIntegrityAlerts,
      examMaxMark: numbers.examMaxMark,
    });
  } catch {
    aiSummary = null;
  }

  if (!numbers.summary) {
    return aiSummary;
  }

  await supabase.from("reports").upsert(
    {
      exam_id: examId,
      school_id: schoolId,
      type: "exam",
      language,
      status: aiSummary ? "generated" : "failed",
      data: {
        summary: numbers.summary,
        subjects: numbers.subjects,
        students: numbers.students,
        gradeDistribution: numbers.gradeDistribution,
        topPerformers: numbers.topPerformers,
        strugglingStudents: numbers.strugglingStudents,
        termTrends: numbers.termTrends,
        dataIntegrityAlerts: numbers.dataIntegrityAlerts,
        studentSubjectMarks: numbers.studentSubjectMarks,
      },
      ai_summary: aiSummary,
    },
    { onConflict: "exam_id,type,language" },
  );

  return aiSummary;
}

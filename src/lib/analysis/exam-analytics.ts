import type { Database } from "@/types/database";

export type SubjectStat = Database["public"]["Views"]["v_exam_subject_stats"]["Row"];
export type StudentStat = Database["public"]["Views"]["v_exam_student_stats"]["Row"];
export type SubjectTermStat = Database["public"]["Views"]["v_exam_subject_term_stats"]["Row"];
export type ExamSummary = Database["public"]["Views"]["v_exam_summary"]["Row"];

const TERM_ORDER = [
  "opener",
  "cat1",
  "cati",
  "term1",
  "cat2",
  "catii",
  "term2",
  "cat3",
  "catiii",
  "term3",
  "midterm",
  "ca",
  "continuousassessment",
  "assignment",
  "project",
  "endterm",
  "final",
  "finalexam",
  "exam",
  "total",
];

function termRank(term: string): number {
  const idx = TERM_ORDER.indexOf(term);
  return idx === -1 ? TERM_ORDER.length : idx;
}

export type GradeDistribution = { grade: string; count: number }[];

/** Counts students per grade (A/B/C/D/F), in a stable, display-friendly order. */
export function computeGradeDistribution(students: StudentStat[]): GradeDistribution {
  const counts = new Map<string, number>();
  for (const s of students) {
    const grade = s.grade ?? "—";
    counts.set(grade, (counts.get(grade) ?? 0) + 1);
  }
  const order = ["A", "B", "C", "D", "F"];
  return order
    .filter((g) => counts.has(g))
    .map((g) => ({ grade: g, count: counts.get(g)! }))
    .concat(
      [...counts.entries()]
        .filter(([g]) => !order.includes(g))
        .map(([grade, count]) => ({ grade, count })),
    );
}

/** Number of students graded F — the "failed" bucket shown everywhere else
 * (grade distribution, class stats), reused for the report-ready email. */
export function countFailedStudents(students: StudentStat[]): number {
  return students.filter((s) => s.grade === "F").length;
}

/** Students already come ranked (best total first) from v_exam_student_stats. */
export function getTopPerformers(students: StudentStat[], limit = 5): StudentStat[] {
  return students.slice(0, limit);
}

/** Bottom-ranked students, worst first — the ones needing support. */
export function getStrugglingStudents(students: StudentStat[], limit = 5): StudentStat[] {
  return [...students].reverse().slice(0, limit);
}

export type SubjectTermTrend = {
  subjectName: string;
  points: { term: string; average: number }[];
};

/** Groups the unpivoted per-term averages back into one ordered trend line
 * (e.g. CAT1 -> CAT2 -> Final) per subject, for "improving/declining" analysis. */
export function computeSubjectTermTrends(termStats: SubjectTermStat[]): SubjectTermTrend[] {
  const bySubject = new Map<string, SubjectTermTrend>();
  for (const row of termStats) {
    if (!row.subject_name || !row.term_key || row.average == null) continue;
    if (row.term_key === "total") continue; // the total isn't a "term" data point
    if (!bySubject.has(row.subject_name)) {
      bySubject.set(row.subject_name, { subjectName: row.subject_name, points: [] });
    }
    bySubject.get(row.subject_name)!.points.push({ term: row.term_key, average: row.average });
  }
  for (const trend of bySubject.values()) {
    trend.points.sort((a, b) => termRank(a.term) - termRank(b.term));
  }
  return [...bySubject.values()];
}

/** A trend is "improving" if its last term average is higher than its first. */
export function trendDirection(trend: SubjectTermTrend): "improving" | "declining" | "flat" | "unknown" {
  if (trend.points.length < 2) return "unknown";
  const first = trend.points[0].average;
  const last = trend.points[trend.points.length - 1].average;
  if (last > first) return "improving";
  if (last < first) return "declining";
  return "flat";
}

export type DataIntegrityAlert = {
  studentId: string;
  studentName: string;
  studentCode: string | null;
  missingSubjects: string[];
};

/**
 * A student's total/percentage only ever reflects the subjects they have an
 * actual result row for (see exam_results — a blank cell never becomes a row,
 * so it can never silently drag an average down). This surfaces exactly
 * which students are missing which subjects, so a low total is something a
 * school admin can explain (or go fix in the source sheet) rather than a
 * silent, confusing "why is this student failing" moment.
 */
export function computeDataIntegrityAlerts(
  students: Pick<StudentStat, "student_id" | "full_name" | "student_code">[],
  subjects: Pick<SubjectStat, "subject_id" | "name">[],
  resultPairs: { student_id: string; subject_id: string }[],
): DataIntegrityAlert[] {
  const present = new Set(resultPairs.map((r) => `${r.student_id}|${r.subject_id}`));
  const alerts: DataIntegrityAlert[] = [];

  for (const student of students) {
    if (!student.student_id) continue;
    const missingSubjects: string[] = [];
    for (const subject of subjects) {
      if (!subject.subject_id) continue;
      if (!present.has(`${student.student_id}|${subject.subject_id}`)) {
        missingSubjects.push(subject.name ?? "");
      }
    }
    if (missingSubjects.length > 0) {
      alerts.push({
        studentId: student.student_id,
        studentName: student.full_name ?? "",
        studentCode: student.student_code,
        missingSubjects,
      });
    }
  }

  return alerts;
}

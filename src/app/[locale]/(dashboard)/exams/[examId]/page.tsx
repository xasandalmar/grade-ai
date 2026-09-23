import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Users2,
  BookOpen,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getExamReportNumbers } from "@/lib/reports/exam-report-data";
import { trendDirection } from "@/lib/analysis/exam-analytics";
import { PrintButton } from "@/components/dashboard/print-button";
import { EmailReportButton } from "@/components/dashboard/email-report-button";
import { ReportLanguageSwitcher } from "@/components/dashboard/report-language-switcher";
import { AiReportSection, AiReportSectionSkeleton } from "./ai-report-section";
import { cn } from "@/lib/utils";

const trendIcon = {
  improving: ArrowUpRight,
  declining: ArrowDownRight,
  flat: Minus,
  unknown: Minus,
} as const;

const trendColor = {
  improving: "text-emerald-600 dark:text-emerald-400",
  declining: "text-red-600 dark:text-red-400",
  flat: "text-muted-foreground",
  unknown: "text-muted-foreground",
} as const;

export default async function ExamReportPage({
  params,
}: {
  params: Promise<{ locale: string; examId: string }>;
}) {
  const { locale, examId } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("report");
  const tExams = await getTranslations("exams");

  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, title, class_name, exam_date, status, school_id")
    .eq("id", examId)
    .single();

  if (!exam) {
    notFound();
  }

  const {
    summary,
    subjects,
    students,
    termTrends,
    gradeDistribution,
    topPerformers,
    strugglingStudents,
    dataIntegrityAlerts,
    studentSubjectMarks,
    examMaxMark,
  } = await getExamReportNumbers(supabase, examId);

  const subjectNameById = new Map(subjects.map((s) => [s.subject_id, s.name]));
  const maxGradeCount = Math.max(1, ...gradeDistribution.map((g) => g.count));

  const summaryCards = [
    { key: "studentCount", icon: Users2, value: summary?.student_count ?? 0 },
    { key: "subjectCount", icon: BookOpen, value: summary?.subject_count ?? 0 },
    { key: "classAverage", icon: TrendingUp, value: summary?.class_average ?? "—" },
    { key: "passRate", icon: TrendingUp, value: summary ? `${summary.pass_rate ?? 0}%` : "—" },
    { key: "failRate", icon: TrendingDown, value: summary ? `${summary.fail_rate ?? 0}%` : "—" },
  ] as const;

  return (
    <div>
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <Link href="/exams" className="text-sm font-medium text-primary hover:underline">
          ← {t("backToExams")}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <ReportLanguageSwitcher />
          <EmailReportButton
            examId={examId}
            locale={locale}
            label={t("emailReport")}
            sentLabel={t("emailReportSent")}
            errorLabel={t("emailReportError")}
          />
          <PrintButton label={t("print")} />
          <a
            href={`/exams/${examId}/pdf`}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            {t("downloadPdf")}
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{exam.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {exam.class_name}
            {exam.exam_date ? ` · ${exam.exam_date}` : ""} · {tExams(`status.${exam.status}`)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {summaryCards.map(({ key, icon: Icon, value }) => (
          <div key={key} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-xl font-semibold text-card-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t(key)}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-card-foreground">{t("subjectsTitle")}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted-foreground">
                <th className="px-3 py-2 text-start font-medium">{t("subjectCol")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("averageCol")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("highestCol")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("lowestCol")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("passRateCol")}</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.subject_id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium text-foreground">{subject.name}</td>
                  <td className="px-3 py-2">{subject.average}</td>
                  <td className="px-3 py-2">{subject.highest}</td>
                  <td className="px-3 py-2">{subject.lowest}</td>
                  <td className="px-3 py-2">{subject.pass_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground">{t("topPerformersTitle")}</h2>
          <ul className="mt-4 space-y-2">
            {topPerformers.map((s) => (
              <li key={s.student_id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {s.rank}. {s.full_name}
                </span>
                <span className="text-muted-foreground">
                  {t("outOf", { total: s.average ?? 0, max: examMaxMark })} ({s.percentage}%) ·{" "}
                  {s.grade}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground">
            {t("strugglingStudentsTitle")}
          </h2>
          <ul className="mt-4 space-y-2">
            {strugglingStudents.map((s) => (
              <li key={s.student_id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {s.rank}. {s.full_name}
                </span>
                <span className="text-muted-foreground">
                  {t("outOf", { total: s.average ?? 0, max: examMaxMark })} ({s.percentage}%) ·{" "}
                  {s.grade}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-card-foreground">{t("gradeDistributionTitle")}</h2>
        <div className="mt-4 space-y-2">
          {gradeDistribution.map(({ grade, count }) => (
            <div key={grade} className="flex items-center gap-3">
              <span className="w-6 shrink-0 text-sm font-medium text-foreground">{grade}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(count / maxGradeCount) * 100}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-end text-sm text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-card-foreground">{t("termTrendsTitle")}</h2>
        {termTrends.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("noTermData")}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {termTrends.map((trend) => {
              const direction = trendDirection(trend);
              const Icon = trendIcon[direction];
              return (
                <div key={trend.subjectName} className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-foreground">{trend.subjectName}</span>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>
                      {trend.points.map((p) => `${p.term.toUpperCase()}: ${p.average}`).join("  →  ")}
                    </span>
                    <span className={cn("flex items-center gap-1 font-medium", trendColor[direction])}>
                      <Icon className="h-4 w-4" />
                      {t(`trend.${direction}`)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-card-foreground">{t("studentsTitle")}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted-foreground">
                <th className="px-3 py-2 text-start font-medium">{t("rankCol")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("nameCol")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("codeCol")}</th>
                {subjects.map((subject) => (
                  <th key={subject.subject_id} className="px-3 py-2 text-start font-medium">
                    {subject.name}
                  </th>
                ))}
                <th className="px-3 py-2 text-start font-medium">{t("totalCol")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("percentageCol")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("gradeCol")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("strongestCol")}</th>
                <th className="px-3 py-2 text-start font-medium">{t("weakestCol")}</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.student_id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-muted-foreground">{student.rank}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{student.full_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{student.student_code ?? "—"}</td>
                  {subjects.map((subject) => {
                    const mark = student.student_id
                      ? studentSubjectMarks[student.student_id]?.[subject.name ?? ""]
                      : undefined;
                    return (
                      <td key={subject.subject_id} className="px-3 py-2">
                        {mark ?? "—"}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2">
                    {t("outOf", { total: student.average ?? 0, max: examMaxMark })}
                  </td>
                  <td className="px-3 py-2">{student.percentage}%</td>
                  <td className="px-3 py-2">{student.grade}</td>
                  <td className="px-3 py-2">
                    {student.strongest_subject_id
                      ? subjectNameById.get(student.strongest_subject_id)
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {student.weakest_subject_id
                      ? subjectNameById.get(student.weakest_subject_id)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-card-foreground">{t("dataIntegrityTitle")}</h2>
        </div>
        {dataIntegrityAlerts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("dataIntegrityNone")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {dataIntegrityAlerts.map((alert) => (
              <li key={alert.studentId} className="text-sm">
                <span className="font-medium text-foreground">{alert.studentName}</span>
                {alert.studentCode ? (
                  <span className="text-muted-foreground"> ({alert.studentCode})</span>
                ) : null}
                <span className="text-amber-700 dark:text-amber-400">
                  {" "}
                  — {t("dataIntegrityMissing")} {alert.missingSubjects.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <Suspense fallback={<AiReportSectionSkeleton />}>
          <AiReportSection
            examId={examId}
            schoolId={exam.school_id}
            locale={locale}
            exam={{ title: exam.title, className: exam.class_name, examDate: exam.exam_date }}
          />
        </Suspense>
      </div>
    </div>
  );
}

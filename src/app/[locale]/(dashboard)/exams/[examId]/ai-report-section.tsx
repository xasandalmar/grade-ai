import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getExamReportNumbers, getOrGenerateAiSummary, type ExamMeta } from "@/lib/reports/exam-report-data";

const AI_SECTION_KEYS = [
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
] as const;

export async function AiReportSection({
  examId,
  schoolId,
  locale,
  exam,
}: {
  examId: string;
  schoolId: string;
  locale: string;
  exam: ExamMeta;
}) {
  const t = await getTranslations("report");
  const supabase = await createClient();

  const numbers = await getExamReportNumbers(supabase, examId);
  const aiSummary = await getOrGenerateAiSummary(supabase, examId, schoolId, locale, exam, numbers);

  if (!aiSummary) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        {t("aiSummaryPending")}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-card-foreground">{t("ai.title")}</h2>
      <div className="mt-4 space-y-4">
        {AI_SECTION_KEYS.map((key) => (
          <div key={key}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(`ai.${key}`)}
            </h3>
            <p className="mt-1 text-sm text-foreground">{aiSummary[key]}</p>
          </div>
        ))}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("ai.recommendations")}
          </h3>
          <ul className="mt-1 list-disc space-y-1 ps-5 text-sm text-foreground">
            {aiSummary.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function AiReportSectionSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="h-4 w-32 rounded bg-muted" />
      <div className="mt-4 space-y-3">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
        <div className="h-3 w-4/6 rounded bg-muted" />
      </div>
    </div>
  );
}

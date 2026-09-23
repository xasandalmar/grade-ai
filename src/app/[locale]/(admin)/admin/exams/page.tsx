import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

function formatDate(value: string | null, locale: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminExamsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("admin.exams");

  const supabase = await createClient();

  const [
    { data: exams },
    { data: schools },
    { data: subjects },
    { data: students },
    { data: reports },
  ] = await Promise.all([
    supabase
      .from("exams")
      .select("id, title, class_name, exam_date, status, school_id, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("schools").select("id, name"),
    supabase.from("exam_subjects").select("exam_id"),
    supabase.from("exam_students").select("exam_id"),
    supabase.from("reports").select("exam_id, ai_summary").eq("type", "exam"),
  ]);

  const schoolNameById = new Map((schools ?? []).map((s) => [s.id, s.name]));

  const subjectCountByExam = new Map<string, number>();
  for (const s of subjects ?? []) {
    subjectCountByExam.set(s.exam_id, (subjectCountByExam.get(s.exam_id) ?? 0) + 1);
  }

  const studentCountByExam = new Map<string, number>();
  for (const s of students ?? []) {
    studentCountByExam.set(s.exam_id, (studentCountByExam.get(s.exam_id) ?? 0) + 1);
  }

  const reportCountByExam = new Map<string, number>();
  const aiCountByExam = new Map<string, number>();
  for (const r of reports ?? []) {
    reportCountByExam.set(r.exam_id, (reportCountByExam.get(r.exam_id) ?? 0) + 1);
    if (r.ai_summary !== null) {
      aiCountByExam.set(r.exam_id, (aiCountByExam.get(r.exam_id) ?? 0) + 1);
    }
  }

  const rows = exams ?? [];

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t("table.title")}</th>
              <th className="px-4 py-3 font-medium">{t("table.school")}</th>
              <th className="px-4 py-3 font-medium">{t("table.class")}</th>
              <th className="px-4 py-3 font-medium">{t("table.date")}</th>
              <th className="px-4 py-3 font-medium">{t("table.status")}</th>
              <th className="px-4 py-3 font-medium">{t("table.students")}</th>
              <th className="px-4 py-3 font-medium">{t("table.subjects")}</th>
              <th className="px-4 py-3 font-medium">{t("table.reports")}</th>
              <th className="px-4 py-3 font-medium">{t("table.aiUsage")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              rows.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link href={`/exams/${e.id}`} className="text-primary hover:underline">
                      {e.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {schoolNameById.get(e.school_id) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.class_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(e.exam_date, locale)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t(`status.${e.status}`)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {studentCountByExam.get(e.id) ?? 0}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {subjectCountByExam.get(e.id) ?? 0}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {reportCountByExam.get(e.id) ?? 0}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {aiCountByExam.get(e.id) ?? 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

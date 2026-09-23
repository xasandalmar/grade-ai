import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/routing";

function formatDate(value: string | null, locale: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminSchoolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("admin.schools");

  const supabase = await createClient();

  const [{ data: schools }, { data: owners }, { data: students }, { data: exams }, { data: reports }] =
    await Promise.all([
      supabase
        .from("schools")
        .select("id, name, address, phone, owner_id, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("exam_students").select("school_id"),
      supabase.from("exams").select("school_id"),
      supabase.from("reports").select("school_id, ai_summary"),
    ]);

  const ownerById = new Map((owners ?? []).map((o) => [o.id, o]));

  const studentCountBySchool = new Map<string, number>();
  for (const s of students ?? []) {
    studentCountBySchool.set(s.school_id, (studentCountBySchool.get(s.school_id) ?? 0) + 1);
  }

  const examCountBySchool = new Map<string, number>();
  for (const e of exams ?? []) {
    examCountBySchool.set(e.school_id, (examCountBySchool.get(e.school_id) ?? 0) + 1);
  }

  const reportCountBySchool = new Map<string, number>();
  const aiCountBySchool = new Map<string, number>();
  for (const r of reports ?? []) {
    reportCountBySchool.set(r.school_id, (reportCountBySchool.get(r.school_id) ?? 0) + 1);
    if (r.ai_summary !== null) {
      aiCountBySchool.set(r.school_id, (aiCountBySchool.get(r.school_id) ?? 0) + 1);
    }
  }

  const rows = schools ?? [];

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t("table.name")}</th>
              <th className="px-4 py-3 font-medium">{t("table.owner")}</th>
              <th className="px-4 py-3 font-medium">{t("table.contact")}</th>
              <th className="px-4 py-3 font-medium">{t("table.registered")}</th>
              <th className="px-4 py-3 font-medium">{t("table.students")}</th>
              <th className="px-4 py-3 font-medium">{t("table.exams")}</th>
              <th className="px-4 py-3 font-medium">{t("table.reports")}</th>
              <th className="px-4 py-3 font-medium">{t("table.aiUsage")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              rows.map((s) => {
                const owner = s.owner_id ? ownerById.get(s.owner_id) : undefined;
                return (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {owner ? (owner.full_name || owner.email) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {[s.address, s.phone].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(s.created_at, locale)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {studentCountBySchool.get(s.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {examCountBySchool.get(s.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {reportCountBySchool.get(s.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {aiCountBySchool.get(s.id) ?? 0}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

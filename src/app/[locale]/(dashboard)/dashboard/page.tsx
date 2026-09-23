import { getTranslations, setRequestLocale } from "next-intl/server";
import { FileSpreadsheet, Users2, CheckCircle2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("nav_sections");
  const tExams = await getTranslations("exams");

  const supabase = await createClient();
  const [exams, students] = await Promise.all([
    supabase.from("exams").select("id, status", { count: "exact" }),
    supabase.from("exam_students").select("*", { count: "exact", head: true }),
  ]);

  const totalExams = exams.count ?? 0;
  const analyzedExams = (exams.data ?? []).filter((e) => e.status === "analyzed").length;

  const stats = [
    { key: "exams", icon: FileSpreadsheet, count: totalExams },
    { key: "analyzed", icon: CheckCircle2, count: analyzedExams },
    { key: "students", icon: Users2, count: students.count ?? 0 },
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">{t("dashboard")}</h1>
        <Link
          href="/exams/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Upload className="h-4 w-4" />
          {tExams("uploadNew")}
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ key, icon: Icon, count }) => (
          <Link
            key={key}
            href="/exams"
            className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:bg-muted"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-2xl font-semibold text-card-foreground">{count}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {key === "exams"
                ? t("exams")
                : key === "analyzed"
                  ? tExams("status.analyzed")
                  : tExams("studentsStat")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

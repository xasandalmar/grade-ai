import { getTranslations, setRequestLocale } from "next-intl/server";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { ExamsList } from "./exams-list";
import type { Locale } from "@/i18n/routing";

export default async function ExamsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("exams");

  const supabase = await createClient();
  const { data: exams } = await supabase
    .from("exams")
    .select("id, title, class_name, exam_date, status, row_count")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/exams/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Upload className="h-4 w-4" />
          {t("uploadNew")}
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <ExamsList exams={exams ?? []} />
      </div>
    </div>
  );
}

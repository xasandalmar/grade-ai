import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { SchoolForm } from "./school-form";
import type { Locale } from "@/i18n/routing";

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("school");

  const supabase = await createClient();
  const { data: school } = await supabase
    .from("schools")
    .select("name, address, phone")
    .single();

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <SchoolForm school={school ?? { name: "", address: "", phone: "" }} />
      </div>
    </div>
  );
}

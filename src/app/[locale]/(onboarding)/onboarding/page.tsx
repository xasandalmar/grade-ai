import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "@/components/auth/auth-card";
import { OnboardingForm } from "./onboarding-form";
import type { Locale } from "@/i18n/routing";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, approval_status")
    .eq("id", user.id)
    .single();

  // A pending/rejected account can't set up a school before a super admin
  // approves it — same gate the dashboard layout enforces.
  if (profile && profile.approval_status !== "approved") {
    redirect(`/${locale}/pending-approval`);
  }

  if (profile?.school_id) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations("onboarding");

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      <OnboardingForm />
    </AuthCard>
  );
}

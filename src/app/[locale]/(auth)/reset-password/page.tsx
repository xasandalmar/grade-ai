import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "./reset-password-form";
import type { Locale } from "@/i18n/routing";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("auth");

  return (
    <AuthCard title={t("resetPassword.title")} subtitle={t("resetPassword.subtitle")}>
      <ResetPasswordForm />
    </AuthCard>
  );
}

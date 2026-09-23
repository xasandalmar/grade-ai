import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "./register-form";
import type { Locale } from "@/i18n/routing";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("auth");

  return (
    <AuthCard
      title={t("register.title")}
      subtitle={t("register.subtitle")}
      footer={
        <>
          {t("register.haveAccount")}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t("register.signInLink")}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}

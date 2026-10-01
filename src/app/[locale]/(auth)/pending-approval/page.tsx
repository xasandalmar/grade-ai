import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "@/components/auth/auth-card";
import { signOutAction } from "../actions";
import type { Locale } from "@/i18n/routing";

export default async function PendingApprovalPage({
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
    .select("approval_status")
    .eq("id", user.id)
    .single();

  // An already-approved account has no business here — send it on to the
  // normal post-login flow instead of showing a stale "pending" message.
  if (profile?.approval_status === "approved") {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations("auth.pendingApproval");
  const isRejected = profile?.approval_status === "rejected";
  const boundSignOut = signOutAction.bind(null, locale);

  return (
    <AuthCard
      title={isRejected ? t("rejectedTitle") : t("pendingTitle")}
      subtitle={isRejected ? t("rejectedBody") : t("pendingBody")}
    >
      <form action={boundSignOut}>
        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          {t("signOut")}
        </button>
      </form>
    </AuthCard>
  );
}

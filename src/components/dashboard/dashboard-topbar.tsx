"use client";

import { useLocale, useTranslations } from "next-intl";
import { signOutAction } from "@/app/[locale]/(auth)/actions";

export function DashboardTopbar({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const boundSignOut = signOutAction.bind(null, locale);

  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
      <div>
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="font-medium text-foreground">{fullName || email}</p>
      </div>
      <form action={boundSignOut}>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {t("signOut")}
        </button>
      </form>
    </div>
  );
}

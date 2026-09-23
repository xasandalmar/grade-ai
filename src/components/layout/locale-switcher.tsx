"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeNames, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function onChange(nextLocale: Locale) {
    router.replace(
      // @ts-expect-error -- pathname may contain dynamic params not known at this call site
      { pathname, params },
      { locale: nextLocale },
    );
  }

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <Languages className="pointer-events-none absolute start-3 h-4 w-4 text-muted-foreground" />
      <label className="sr-only" htmlFor="locale-switcher">
        {t("label")}
      </label>
      <select
        id="locale-switcher"
        value={locale}
        onChange={(event) => onChange(event.target.value as Locale)}
        className="h-9 cursor-pointer appearance-none rounded-full border border-border bg-card ps-9 pe-4 text-sm text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeNames[code]}
          </option>
        ))}
      </select>
    </div>
  );
}

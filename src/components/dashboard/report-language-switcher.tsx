"use client";

import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeNames, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** A prominent, report-specific language toggle — switching it re-renders the
 * whole report (including the AI narrative) in that language, generating and
 * caching it on first view if it hasn't been requested before. */
export function ReportLanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function onSelect(nextLocale: Locale) {
    if (nextLocale === locale) return;
    router.replace(
      // @ts-expect-error -- pathname may contain dynamic params not known at this call site
      { pathname, params },
      { locale: nextLocale },
    );
  }

  return (
    <div className={cn("no-print inline-flex rounded-full border border-border bg-card p-1", className)}>
      {locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            aria-pressed={active}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {localeNames[code]}
          </button>
        );
      })}
    </div>
  );
}

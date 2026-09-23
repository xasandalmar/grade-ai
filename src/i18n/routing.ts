import { defineRouting } from "next-intl/routing";

export const locales = ["en", "so", "ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  so: "Soomaali",
  ar: "العربية",
};

export const rtlLocales: readonly Locale[] = ["ar"];

export function isRtl(locale: string): boolean {
  return (rtlLocales as readonly string[]).includes(locale);
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});

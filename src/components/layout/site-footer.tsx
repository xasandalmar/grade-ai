import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <span>© {year} Grade AI</span>
        <span>{t("rights")}</span>
      </div>
    </footer>
  );
}

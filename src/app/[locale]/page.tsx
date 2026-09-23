import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import {
  BarChart3,
  BrainCircuit,
  FileSpreadsheet,
  Globe2,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

const featureIcons = {
  excel: FileSpreadsheet,
  analysis: BarChart3,
  aiReports: BrainCircuit,
  assistant: MessagesSquare,
  languages: Globe2,
  security: ShieldCheck,
} as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("home");
  const featureKeys = Object.keys(featureIcons) as (keyof typeof featureIcons)[];

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24 lg:px-8">
        <span className="inline-flex items-center rounded-full border border-border bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground">
          {t("badge")}
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {t("ctaPrimary")}
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {t("ctaSecondary")}
          </Link>
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-semibold text-foreground sm:text-3xl">
            {t("featuresTitle")}
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureKeys.map((key) => {
              const Icon = featureIcons[key];
              return (
                <div
                  key={key}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-card-foreground">
                    {t(`features.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(`features.${key}.description`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

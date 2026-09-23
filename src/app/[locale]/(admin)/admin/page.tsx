import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Users2,
  UserCheck,
  UserX,
  School,
  GraduationCap,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Mail,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

async function countRows(
  query: PromiseLike<{ count: number | null }>,
): Promise<number> {
  const { count } = await query;
  return count ?? 0;
}

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("admin.overview");

  const supabase = await createClient();

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalSchools,
    totalStudents,
    totalExams,
    totalReports,
    aiRequests,
    emailsSent,
  ] = await Promise.all([
    countRows(supabase.from("profiles").select("*", { count: "exact", head: true })),
    countRows(
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
    ),
    countRows(
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "suspended"),
    ),
    countRows(supabase.from("schools").select("*", { count: "exact", head: true })),
    countRows(supabase.from("exam_students").select("*", { count: "exact", head: true })),
    countRows(supabase.from("exams").select("*", { count: "exact", head: true })),
    countRows(supabase.from("reports").select("*", { count: "exact", head: true })),
    countRows(
      supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .not("ai_summary", "is", null),
    ),
    countRows(
      supabase.from("email_logs").select("*", { count: "exact", head: true }).eq("status", "sent"),
    ),
  ]);

  const stats = [
    { key: "totalUsers", icon: Users2, value: totalUsers, href: "/admin/users" },
    {
      key: "activeUsers",
      icon: UserCheck,
      value: activeUsers,
      href: "/admin/users?status=active",
    },
    {
      key: "suspendedUsers",
      icon: UserX,
      value: suspendedUsers,
      href: "/admin/users?status=suspended",
    },
    { key: "totalSchools", icon: School, value: totalSchools, href: "/admin/schools" },
    { key: "totalStudents", icon: GraduationCap, value: totalStudents, href: "/admin/schools" },
    { key: "totalExams", icon: FileSpreadsheet, value: totalExams, href: "/admin/exams" },
    { key: "totalReports", icon: FileText, value: totalReports, href: "/admin/exams" },
    { key: "aiRequests", icon: Sparkles, value: aiRequests, href: "/admin/exams" },
    { key: "emailsSent", icon: Mail, value: emailsSent, href: null },
  ] as const;

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ key, icon: Icon, value, href }) => {
          const card = (
            <>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-2xl font-semibold text-card-foreground">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(key)}</p>
            </>
          );

          return href ? (
            <Link
              key={key}
              href={href}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:bg-muted hover:border-primary/40"
            >
              {card}
            </Link>
          ) : (
            <div key={key} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}

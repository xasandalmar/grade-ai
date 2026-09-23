import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { UserStatusForm } from "@/components/admin/user-status-form";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

const VALID_STATUS_FILTERS = ["active", "suspended", "deactivated"] as const;
type StatusFilter = (typeof VALID_STATUS_FILTERS)[number];

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: "user" | "super_admin";
  status: "active" | "suspended" | "deactivated";
  school_id: string | null;
  created_at: string;
  last_active_at: string | null;
};

function formatDate(value: string | null, locale: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { locale } = await params;
  const { q, status } = await searchParams;
  const statusFilter = VALID_STATUS_FILTERS.includes(status as StatusFilter)
    ? (status as StatusFilter)
    : null;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("admin.users");

  const supabase = await createClient();

  let usersQuery = supabase
    .from("profiles")
    .select("id, full_name, email, role, status, school_id, created_at, last_active_at")
    .order("created_at", { ascending: false });

  if (q) {
    usersQuery = usersQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  }
  if (statusFilter) {
    usersQuery = usersQuery.eq("status", statusFilter);
  }

  const [{ data: users }, { data: schools }, { data: exams }, { data: reports }] =
    await Promise.all([
      usersQuery,
      supabase.from("schools").select("id, name"),
      supabase.from("exams").select("school_id"),
      supabase.from("reports").select("school_id, ai_summary"),
    ]);

  const schoolNameById = new Map((schools ?? []).map((s) => [s.id, s.name]));

  const examCountBySchool = new Map<string, number>();
  for (const e of exams ?? []) {
    examCountBySchool.set(e.school_id, (examCountBySchool.get(e.school_id) ?? 0) + 1);
  }

  const reportCountBySchool = new Map<string, number>();
  const aiCountBySchool = new Map<string, number>();
  for (const r of reports ?? []) {
    reportCountBySchool.set(r.school_id, (reportCountBySchool.get(r.school_id) ?? 0) + 1);
    if (r.ai_summary !== null) {
      aiCountBySchool.set(r.school_id, (aiCountBySchool.get(r.school_id) ?? 0) + 1);
    }
  }

  const rows = (users ?? []) as UserRow[];

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

      <form className="mt-6 flex flex-wrap items-center gap-3" method="get">
        {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder={t("searchPlaceholder")}
          className="h-11 w-full max-w-sm rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 sm:max-w-md"
        />
        {statusFilter && (
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
          >
            {t(`status.${statusFilter}`)}
            <span aria-hidden>×</span>
          </Link>
        )}
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t("table.name")}</th>
              <th className="px-4 py-3 font-medium">{t("table.email")}</th>
              <th className="px-4 py-3 font-medium">{t("table.school")}</th>
              <th className="px-4 py-3 font-medium">{t("table.role")}</th>
              <th className="px-4 py-3 font-medium">{t("table.status")}</th>
              <th className="px-4 py-3 font-medium">{t("table.registered")}</th>
              <th className="px-4 py-3 font-medium">{t("table.lastActive")}</th>
              <th className="px-4 py-3 font-medium">{t("table.exams")}</th>
              <th className="px-4 py-3 font-medium">{t("table.reports")}</th>
              <th className="px-4 py-3 font-medium">{t("table.aiUsage")}</th>
              <th className="px-4 py-3 font-medium">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{u.full_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.school_id ? (schoolNameById.get(u.school_id) ?? t("noSchool")) : t("noSchool")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.status === "active"
                          ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                          : u.status === "suspended"
                            ? "rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400"
                            : "rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400"
                      }
                    >
                      {t(`status.${u.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(u.created_at, locale)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.last_active_at ? formatDate(u.last_active_at, locale) : t("never")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.school_id ? (examCountBySchool.get(u.school_id) ?? 0) : 0}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.school_id ? (reportCountBySchool.get(u.school_id) ?? 0) : 0}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.school_id ? (aiCountBySchool.get(u.school_id) ?? 0) : 0}
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "super_admin" ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {u.status !== "active" && (
                          <UserStatusForm
                            userId={u.id}
                            nextStatus="active"
                            label={
                              u.status === "suspended"
                                ? t("actions.reactivate")
                                : t("actions.activate")
                            }
                          />
                        )}
                        {u.status !== "suspended" && (
                          <UserStatusForm
                            userId={u.id}
                            nextStatus="suspended"
                            label={t("actions.suspend")}
                          />
                        )}
                        {u.status !== "deactivated" && (
                          <UserStatusForm
                            userId={u.id}
                            nextStatus="deactivated"
                            label={t("actions.deactivate")}
                          />
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

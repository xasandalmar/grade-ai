import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/routing";

export default async function AdminAuditLogsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("admin.auditLogs");

  const supabase = await createClient();

  const [{ data: logs }, { data: profiles }, { data: schools }] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("id, actor_id, actor_role, school_id, action, target_table, target_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("profiles").select("id, email"),
    supabase.from("schools").select("id, name"),
  ]);

  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));
  const schoolNameById = new Map((schools ?? []).map((s) => [s.id, s.name]));

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">{t("table.time")}</th>
              <th className="px-4 py-3 font-medium">{t("table.actor")}</th>
              <th className="px-4 py-3 font-medium">{t("table.action")}</th>
              <th className="px-4 py-3 font-medium">{t("table.target")}</th>
              <th className="px-4 py-3 font-medium">{t("table.school")}</th>
              <th className="px-4 py-3 font-medium">{t("table.details")}</th>
            </tr>
          </thead>
          <tbody>
            {!logs || logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {new Date(log.created_at).toLocaleString(locale)}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {log.actor_id ? (emailById.get(log.actor_id) ?? log.actor_id) : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{log.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {log.target_table ? `${log.target_table}:${log.target_id ?? "—"}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {log.school_id ? (schoolNameById.get(log.school_id) ?? log.school_id) : "—"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                    {log.metadata && Object.keys(log.metadata as object).length > 0
                      ? JSON.stringify(log.metadata)
                      : "—"}
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

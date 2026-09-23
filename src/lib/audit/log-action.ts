import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type AuditLogEntry = {
  actorId: string;
  actorRole: "user" | "super_admin";
  schoolId?: string | null;
  action: string;
  targetTable?: string;
  targetId?: string;
  metadata?: Record<string, Json>;
};

/**
 * Records a critical platform action for the Super Admin audit log viewer.
 * Uses the service-role client because audit_logs has no client-side insert
 * policy — only server-only admin actions may write to it. Never throws:
 * a logging failure must not block the action it's describing.
 */
export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      actor_id: entry.actorId,
      actor_role: entry.actorRole,
      school_id: entry.schoolId ?? null,
      action: entry.action,
      target_table: entry.targetTable ?? null,
      target_id: entry.targetId ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch {
    // Best-effort logging only.
  }
}

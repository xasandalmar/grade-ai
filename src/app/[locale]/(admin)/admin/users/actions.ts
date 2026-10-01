"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditAction } from "@/lib/audit/log-action";
import type { Enums } from "@/types/database";

export type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const VALID_STATUSES: Enums<"user_status">[] = ["active", "suspended", "deactivated"];

/**
 * Changes a user's status (activate / suspend / deactivate / reactivate all
 * collapse to setting `status`). Every caller check happens server-side,
 * independent of the layout's own gate:
 *  1. Re-verify the caller is a signed-in, active super_admin.
 *  2. Refuse to let a super admin change their own status (no accidental
 *     self-lockout).
 *  3. Only then use the service-role client — the `prevent_role_status_self_escalation`
 *     trigger on profiles rejects role/status writes from any other caller,
 *     so this is also enforced at the database layer, not just here.
 * Every successful change is written to audit_logs.
 */
export async function updateUserStatusAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const targetUserId = formData.get("userId");
  const nextStatus = formData.get("status");

  if (typeof targetUserId !== "string" || typeof nextStatus !== "string") {
    return { status: "error", message: "invalid_request" };
  }
  if (!VALID_STATUSES.includes(nextStatus as Enums<"user_status">)) {
    return { status: "error", message: "invalid_request" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "unauthorized" };
  }

  const { data: caller } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!caller || caller.role !== "super_admin" || caller.status !== "active") {
    return { status: "error", message: "unauthorized" };
  }

  if (targetUserId === user.id) {
    return { status: "error", message: "cannot_change_self" };
  }

  const admin = createAdminClient();
  const { data: target, error } = await admin
    .from("profiles")
    .update({ status: nextStatus as Enums<"user_status"> })
    .eq("id", targetUserId)
    .select("id, email, school_id, status")
    .single();

  if (error || !target) {
    return { status: "error", message: "update_failed" };
  }

  await logAuditAction({
    actorId: user.id,
    actorRole: "super_admin",
    schoolId: target.school_id,
    action: `user.status.${nextStatus}`,
    targetTable: "profiles",
    targetId: target.id,
    metadata: { email: target.email, newStatus: nextStatus },
  });

  return { status: "success" };
}

const VALID_APPROVAL_STATUSES: Enums<"user_approval_status">[] = ["approved", "rejected"];

/**
 * Approves or rejects a pending signup. Same security shape as
 * updateUserStatusAction above:
 *  1. Re-verify the caller is a signed-in, active super_admin.
 *  2. Refuse to let a super admin act on their own account.
 *  3. Use the service-role client — `prevent_role_status_self_escalation`
 *     rejects approval_status writes from any other caller, so this is also
 *     enforced at the database layer, not just here.
 * Every successful change is written to audit_logs.
 */
export async function updateUserApprovalAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const targetUserId = formData.get("userId");
  const nextApprovalStatus = formData.get("approvalStatus");

  if (typeof targetUserId !== "string" || typeof nextApprovalStatus !== "string") {
    return { status: "error", message: "invalid_request" };
  }
  if (!VALID_APPROVAL_STATUSES.includes(nextApprovalStatus as Enums<"user_approval_status">)) {
    return { status: "error", message: "invalid_request" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "unauthorized" };
  }

  const { data: caller } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!caller || caller.role !== "super_admin" || caller.status !== "active") {
    return { status: "error", message: "unauthorized" };
  }

  if (targetUserId === user.id) {
    return { status: "error", message: "cannot_change_self" };
  }

  const admin = createAdminClient();
  const { data: target, error } = await admin
    .from("profiles")
    .update({ approval_status: nextApprovalStatus as Enums<"user_approval_status"> })
    .eq("id", targetUserId)
    .select("id, email, school_id, approval_status")
    .single();

  if (error || !target) {
    return { status: "error", message: "update_failed" };
  }

  await logAuditAction({
    actorId: user.id,
    actorRole: "super_admin",
    schoolId: target.school_id,
    action: `user.approval.${nextApprovalStatus}`,
    targetTable: "profiles",
    targetId: target.id,
    metadata: { email: target.email, newApprovalStatus: nextApprovalStatus },
  });

  return { status: "success" };
}

"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateUserStatusAction, type ActionState } from "@/app/[locale]/(admin)/admin/users/actions";

const initialState: ActionState = { status: "idle" };

const CONFIRM_KEY: Record<string, string> = {
  suspended: "confirmSuspend",
  deactivated: "confirmDeactivate",
  active: "confirmReactivate",
};

/**
 * A native window.confirm() inside a form submit handler is unreliable in
 * automated/embedded browser contexts (auto-dismissed as cancel) and easy to
 * blow past by accident. Instead this asks for a second click: the button
 * turns into an explicit "Confirm?" for a few seconds, then reverts.
 */
export function UserStatusForm({
  userId,
  nextStatus,
  label,
}: {
  userId: string;
  nextStatus: "active" | "suspended" | "deactivated";
  label: string;
}) {
  const t = useTranslations("admin.users");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateUserStatusAction, initialState);
  const lastStatus = useRef<ActionState["status"]>("idle");
  const [armed, setArmed] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.status === "success" && lastStatus.current !== "success") {
      router.refresh();
    }
    lastStatus.current = state.status;
  }, [state, router]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const confirmMessage = CONFIRM_KEY[nextStatus] ? t(CONFIRM_KEY[nextStatus]) : undefined;

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirmMessage && !armed) {
          e.preventDefault();
          setArmed(true);
          resetTimer.current = setTimeout(() => setArmed(false), 4000);
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={nextStatus} />
      <button
        type="submit"
        disabled={pending}
        title={armed ? confirmMessage : undefined}
        className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {armed ? t("clickToConfirm") : label}
      </button>
    </form>
  );
}

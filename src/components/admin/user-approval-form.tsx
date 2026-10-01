"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateUserApprovalAction, type ActionState } from "@/app/[locale]/(admin)/admin/users/actions";

const initialState: ActionState = { status: "idle" };

const CONFIRM_KEY: Record<string, string> = {
  approved: "confirmApprove",
  rejected: "confirmReject",
};

/** Same two-click confirm pattern as UserStatusForm — see that file for why. */
export function UserApprovalForm({
  userId,
  nextApprovalStatus,
  label,
}: {
  userId: string;
  nextApprovalStatus: "approved" | "rejected";
  label: string;
}) {
  const t = useTranslations("admin.users");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateUserApprovalAction, initialState);
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

  const confirmMessage = CONFIRM_KEY[nextApprovalStatus]
    ? t(CONFIRM_KEY[nextApprovalStatus])
    : undefined;

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
      <input type="hidden" name="approvalStatus" value={nextApprovalStatus} />
      <button
        type="submit"
        disabled={pending}
        title={armed ? confirmMessage : undefined}
        className={
          armed
            ? "rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            : nextApprovalStatus === "approved"
              ? "rounded-full border border-emerald-600/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-400"
              : "rounded-full border border-red-600/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400"
        }
      >
        {armed ? t("clickToConfirm") : label}
      </button>
    </form>
  );
}

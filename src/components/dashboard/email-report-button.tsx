"use client";

import { useActionState } from "react";
import { Mail, Check, AlertCircle } from "lucide-react";
import {
  resendReportEmailAction,
  type ResendReportEmailState,
} from "@/app/[locale]/(dashboard)/exams/[examId]/actions";

const initialState: ResendReportEmailState = { status: "idle" };

export function EmailReportButton({
  examId,
  locale,
  label,
  sentLabel,
  errorLabel,
}: {
  examId: string;
  locale: string;
  label: string;
  sentLabel: string;
  errorLabel: string;
}) {
  const boundAction = resendReportEmailAction.bind(null, examId, locale);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state.status === "success" ? (
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        ) : state.status === "error" ? (
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {pending
          ? label
          : state.status === "success"
            ? sentLabel
            : state.status === "error"
              ? errorLabel
              : label}
      </button>
    </form>
  );
}

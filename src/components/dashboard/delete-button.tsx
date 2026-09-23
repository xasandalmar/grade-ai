"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({
  action,
  confirmMessage,
  label,
  errorMessage,
}: {
  action: () => Promise<{ error?: string } | void>;
  confirmMessage: string;
  label: string;
  /** Shown if the delete fails (e.g. a foreign-key restriction blocked it). */
  errorMessage?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={label}
      disabled={isPending}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          startTransition(async () => {
            const result = await action();
            if (result?.error) {
              window.alert(errorMessage ?? result.error);
            }
          });
        }
      }}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updatePasswordAction, type ActionState } from "../actions";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Link } from "@/i18n/navigation";

const initialState: ActionState = { status: "idle" };

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const [state, formAction] = useActionState(updatePasswordAction, initialState);

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <FormMessage variant="success">
          <p className="font-medium">{t("resetPassword.successTitle")}</p>
          <p className="mt-1">{t("resetPassword.successBody")}</p>
        </FormMessage>
        <Link
          href="/dashboard"
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          {t("resetPassword.goToDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message ? (
        <FormMessage variant="error">{t(`errors.${state.message}`)}</FormMessage>
      ) : null}
      <div>
        <Label htmlFor="password">{t("newPasswordLabel")}</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        {state.fieldErrors?.password ? (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            {state.fieldErrors.password[0]}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-muted-foreground">{t("passwordHint")}</p>
        )}
      </div>
      <SubmitButton pendingText={t("resetPassword.submitPending")}>
        {t("resetPassword.submit")}
      </SubmitButton>
    </form>
  );
}

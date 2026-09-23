"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { requestPasswordResetAction, type ActionState } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: ActionState = { status: "idle" };

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const boundAction = requestPasswordResetAction.bind(null, locale);
  const [state, formAction] = useActionState(boundAction, initialState);

  if (state.status === "success") {
    return (
      <FormMessage variant="success">
        <p className="font-medium">{t("forgotPassword.successTitle")}</p>
        <p className="mt-1">{t("forgotPassword.successBody")}</p>
      </FormMessage>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message ? (
        <FormMessage variant="error">{t(`errors.${state.message}`)}</FormMessage>
      ) : null}
      <div>
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <SubmitButton pendingText={t("forgotPassword.submitPending")}>
        {t("forgotPassword.submit")}
      </SubmitButton>
    </form>
  );
}

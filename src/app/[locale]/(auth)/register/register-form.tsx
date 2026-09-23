"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { signUpAction, type ActionState } from "../actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { useRouter } from "@/i18n/navigation";

const initialState: ActionState = { status: "idle" };

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [state, formAction] = useActionState(signUpAction, initialState);

  useEffect(() => {
    if (state.status === "success" && state.message === "signed_in") {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state.status, state.message, router]);

  if (state.status === "success" && state.message === "check_email") {
    return (
      <FormMessage variant="success">
        <p className="font-medium">{t("register.checkEmailTitle")}</p>
        <p className="mt-1">{t("register.checkEmailBody")}</p>
      </FormMessage>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message ? (
        <FormMessage variant="error">{t(`errors.${state.message}`)}</FormMessage>
      ) : null}
      <div>
        <Label htmlFor="fullName">{t("fullNameLabel")}</Label>
        <Input id="fullName" name="fullName" type="text" autoComplete="name" required />
        {state.fieldErrors?.fullName ? (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            {state.fieldErrors.fullName[0]}
          </p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {state.fieldErrors?.email ? (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            {state.fieldErrors.email[0]}
          </p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="password">{t("passwordLabel")}</Label>
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
      <SubmitButton pendingText={t("register.submitPending")}>
        {t("register.submit")}
      </SubmitButton>
    </form>
  );
}

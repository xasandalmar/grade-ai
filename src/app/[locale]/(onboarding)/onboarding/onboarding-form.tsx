"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createSchoolAction } from "./actions";
import type { ActionState } from "@/app/[locale]/(auth)/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: ActionState = { status: "idle" };

export function OnboardingForm() {
  const t = useTranslations("onboarding");
  const tAuthErrors = useTranslations("auth.errors");
  const locale = useLocale();
  const boundAction = createSchoolAction.bind(null, locale);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message ? (
        <FormMessage variant="error">{tAuthErrors(state.message)}</FormMessage>
      ) : null}
      <div>
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input id="name" name="name" type="text" required />
        {state.fieldErrors?.name ? (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            {state.fieldErrors.name[0]}
          </p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="address">{t("addressLabel")}</Label>
        <Input id="address" name="address" type="text" />
      </div>
      <div>
        <Label htmlFor="phone">{t("phoneLabel")}</Label>
        <Input id="phone" name="phone" type="tel" />
      </div>
      <SubmitButton pendingText={t("submitPending")}>{t("submit")}</SubmitButton>
    </form>
  );
}

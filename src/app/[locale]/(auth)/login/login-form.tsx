"use client";

import { useActionState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { signInAction, type ActionState } from "../actions";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Link } from "@/i18n/navigation";

const initialState: ActionState = { status: "idle" };

export function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction] = useActionState(signInAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      router.push(searchParams.get("next") ?? `/${locale}/dashboard`);
      router.refresh();
    }
  }, [state.status, router, searchParams, locale]);

  return (
    <form action={formAction} className="space-y-4">
      {searchParams.get("suspended") ? (
        <FormMessage variant="error">{t("errors.account_suspended")}</FormMessage>
      ) : null}
      {state.status === "error" && state.message ? (
        <FormMessage variant="error">{t(`errors.${state.message}`)}</FormMessage>
      ) : null}
      <div>
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("passwordLabel")}</Label>
          <Link
            href="/forgot-password"
            className="mb-1.5 text-xs font-medium text-primary hover:underline"
          >
            {t("login.forgotPassword")}
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </div>
      <SubmitButton pendingText={t("login.submitPending")}>{t("login.submit")}</SubmitButton>
    </form>
  );
}

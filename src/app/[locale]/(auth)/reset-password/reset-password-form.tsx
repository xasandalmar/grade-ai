"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { updatePasswordAction, type ActionState } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Link } from "@/i18n/navigation";

const initialState: ActionState = { status: "idle" };

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const [state, formAction] = useActionState(updatePasswordAction, initialState);
  const [sessionStatus, setSessionStatus] = useState<"checking" | "ready" | "invalid">("checking");

  useEffect(() => {
    // The recovery link lands here with the session in the URL's #hash
    // fragment (access_token/refresh_token) — Supabase's implicit-grant
    // format, which is the only kind an admin-generated recovery link can
    // produce. Fragments never reach the server, so only client-side code
    // can read them.
    //
    // @supabase/ssr's browser client hardcodes flowType: "pkce", so its own
    // automatic detectSessionInUrl handling actively REJECTS an implicit
    // hash (throws AuthPKCEGrantCodeExchangeError internally, swallowed by
    // its own init logic) rather than consuming it — relying on that
    // silently does nothing. Instead, the tokens are read directly out of
    // the hash here and handed to setSession() explicitly, which has no
    // such flow-type restriction.
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      // Deferred a tick so this still resolves asynchronously like the
      // setSession() branch below, rather than setting state synchronously
      // inside the effect body.
      Promise.resolve().then(() => setSessionStatus("invalid"));
      return;
    }

    const supabase = createClient();
    supabase.auth.setSession({ access_token, refresh_token }).then(({ data, error }) => {
      // Scrub the tokens from the visible URL/history regardless of outcome
      // — they're single-use, but there's no reason to leave them sitting
      // in the address bar or browser history either way.
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      setSessionStatus(data.session && !error ? "ready" : "invalid");
    });
  }, []);

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

  if (sessionStatus === "checking") {
    return <p className="text-sm text-muted-foreground">{t("resetPassword.checkingLink")}</p>;
  }

  if (sessionStatus === "invalid") {
    return (
      <div className="space-y-4">
        <FormMessage variant="error">
          <p className="font-medium">{t("resetPassword.invalidLinkTitle")}</p>
          <p className="mt-1">{t("resetPassword.invalidLinkBody")}</p>
        </FormMessage>
        <Link
          href="/forgot-password"
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          {t("resetPassword.requestNewLink")}
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

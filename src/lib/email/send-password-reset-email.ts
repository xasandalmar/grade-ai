import "server-only";
import { getResendClient, RESEND_FROM_EMAIL } from "./resend-client";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  passwordResetEmailHtml,
  passwordResetEmailSubject,
  passwordResetEmailText,
  type PasswordResetLanguage,
} from "./templates/password-reset";

export type SendPasswordResetEmailResult = { ok: boolean; error?: string };

function toEmailLanguage(locale: string): PasswordResetLanguage {
  return locale === "so" || locale === "ar" ? locale : "en";
}

/**
 * Sends the password-reset email entirely through the app's own Resend
 * pipeline instead of Supabase Auth's built-in mailer (supabase.auth
 * .resetPasswordForEmail). That relies on Supabase's own SMTP relay being
 * correctly configured in the dashboard, which has failed in production with
 * a bare "Error sending recovery email" / 500 and no way to inspect or fix it
 * from application code. This sidesteps that entirely: the service-role
 * admin API generates the same kind of recovery link Supabase would have
 * emailed itself (auth/v1/verify?type=recovery&token=...&redirect_to=...,
 * handled by the existing /auth/callback route exactly as before), and the
 * app sends it — the same infrastructure already proven to work for
 * report-ready emails.
 *
 * Never reveals whether an email address has an account: a "user not found"
 * response from generateLink is treated as a silent no-op success, exactly
 * like Supabase's own resetPasswordForEmail behaves for the same reason.
 */
export async function sendPasswordResetEmail(
  email: string,
  redirectTo: string,
  locale: string,
): Promise<SendPasswordResetEmailResult> {
  const language = toEmailLanguage(locale);
  const admin = createAdminClient();

  const { data, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  if (linkError) {
    const notFound =
      linkError.message.toLowerCase().includes("not found") ||
      linkError.message.toLowerCase().includes("no user");
    if (notFound) {
      // Deliberately not logged as a failure — this is the expected shape of
      // "someone tried an email with no account," not an infrastructure bug.
      return { ok: true };
    }
    console.error("[sendPasswordResetEmail] generateLink failed:", {
      message: linkError.message,
      status: linkError.status,
      code: linkError.code,
    });
    try {
      await admin.from("email_logs").insert({
        type: "password_reset",
        recipient: email,
        status: "failed",
        error: `generateLink: ${linkError.message}`,
      });
    } catch {
      // Best-effort logging only.
    }
    return { ok: false, error: "link_generation_failed" };
  }

  const resetUrl = data.properties?.action_link;
  if (!resetUrl) {
    console.error("[sendPasswordResetEmail] generateLink returned no action_link", { email });
    return { ok: false, error: "link_generation_failed" };
  }

  const client = getResendClient();
  if (!client) {
    try {
      await admin.from("email_logs").insert({
        type: "password_reset",
        recipient: email,
        status: "skipped",
        error: "RESEND_API_KEY is not configured",
      });
    } catch {
      // Best-effort logging only.
    }
    return { ok: false, error: "not_configured" };
  }

  try {
    const { data: sendData, error: sendError } = await client.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [email],
      subject: passwordResetEmailSubject(language),
      html: passwordResetEmailHtml({ resetUrl, language }),
      text: passwordResetEmailText({ resetUrl, language }),
      headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
    });

    await admin.from("email_logs").insert({
      type: "password_reset",
      recipient: email,
      status: sendError ? "failed" : "sent",
      provider_message_id: sendData?.id ?? null,
      error: sendError?.message ?? null,
    });

    if (sendError) {
      console.error("[sendPasswordResetEmail] Resend send failed:", sendError.message);
      return { ok: false, error: sendError.message };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    console.error("[sendPasswordResetEmail] unexpected error:", message);
    try {
      await admin.from("email_logs").insert({
        type: "password_reset",
        recipient: email,
        status: "failed",
        error: message,
      });
    } catch {
      // Best-effort logging only.
    }
    return { ok: false, error: "send_failed" };
  }
}

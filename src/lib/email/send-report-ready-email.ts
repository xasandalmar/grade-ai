import "server-only";
import { getResendClient, RESEND_FROM_EMAIL } from "./resend-client";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  reportReadyEmailHtml,
  reportReadyEmailSubject,
  reportReadyEmailText,
  type ReportReadyLanguage,
} from "./templates/report-ready";

export type SendReportReadyEmailInput = {
  schoolId: string;
  recipientEmail: string;
  recipientName: string;
  schoolName: string;
  className: string;
  examTitle: string;
  classAverage: number | null;
  passRate: number | null;
  failedStudentsCount: number;
  reportUrl: string;
  language: string;
  /** The same branded PDF the download button produces, attached in full —
   * never omitted silently if the caller supplies one. */
  pdf?: { buffer: Buffer; filename: string };
};

export type SendReportReadyEmailResult = { ok: boolean; error?: string };

function toEmailLanguage(locale: string): ReportReadyLanguage {
  return locale === "so" || locale === "ar" ? locale : "en";
}

/**
 * Sends the "your report is ready" notification to the currently
 * authenticated user's own registered email — never anyone else's, and
 * never any per-student data, only the class-level summary already computed
 * elsewhere. Every attempt (success or failure) is written to email_logs via
 * the service-role client, since that table has no client-side insert
 * policy. Never throws — a failed/unconfigured email must not block the
 * exam upload or report view that triggered it.
 */
export async function sendReportReadyEmail(
  input: SendReportReadyEmailInput,
): Promise<SendReportReadyEmailResult> {
  const language = toEmailLanguage(input.language);
  const templateData = {
    recipientName: input.recipientName,
    schoolName: input.schoolName,
    className: input.className,
    examTitle: input.examTitle,
    classAverage: input.classAverage,
    passRate: input.passRate,
    failedStudentsCount: input.failedStudentsCount,
    reportUrl: input.reportUrl,
    language,
    hasAttachment: Boolean(input.pdf),
  };

  const admin = createAdminClient();
  const client = getResendClient();

  if (!client) {
    try {
      await admin.from("email_logs").insert({
        school_id: input.schoolId,
        type: "report_ready",
        recipient: input.recipientEmail,
        status: "skipped",
        error: "RESEND_API_KEY is not configured",
      });
    } catch {
      // Best-effort logging only.
    }
    return { ok: false, error: "not_configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [input.recipientEmail],
      subject: reportReadyEmailSubject(language, input.examTitle, input.schoolName),
      html: reportReadyEmailHtml(templateData),
      text: reportReadyEmailText(templateData),
      attachments: input.pdf
        ? [{ filename: input.pdf.filename, content: input.pdf.buffer }]
        : undefined,
      // Every send gets its own unique reference — without this, mail
      // clients (Gmail in particular) group repeated "report ready" emails
      // for the same exam/subject into one continuing thread. This keeps
      // each send a distinct, standalone email in the inbox.
      headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
    });

    await admin.from("email_logs").insert({
      school_id: input.schoolId,
      type: "report_ready",
      recipient: input.recipientEmail,
      status: error ? "failed" : "sent",
      provider_message_id: data?.id ?? null,
      error: error?.message ?? null,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    try {
      await admin.from("email_logs").insert({
        school_id: input.schoolId,
        type: "report_ready",
        recipient: input.recipientEmail,
        status: "failed",
        error: err instanceof Error ? err.message : "unknown_error",
      });
    } catch {
      // Best-effort logging only.
    }
    return { ok: false, error: "send_failed" };
  }
}

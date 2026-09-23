import "server-only";
import { Resend } from "resend";

let client: Resend | null = null;

/** Server-only Resend client. Returns null if no key is configured, so
 * callers can skip email delivery gracefully instead of crashing the exam
 * upload/report flow that triggers it. */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}

/** "Name <address>" — the account has no verified custom domain yet, so this
 * defaults to Resend's own onboarding sender, which is allowed to send
 * without domain verification. */
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Grade AI <onboarding@resend.dev>";

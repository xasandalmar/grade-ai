"use server";

import { createClient } from "@/lib/supabase/server";
import { getExamReportNumbers } from "@/lib/reports/exam-report-data";
import { notifyReportReady } from "@/lib/email/send-report-ready-notification";
import { getOrigin } from "@/lib/get-origin";

export type ResendReportEmailState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/**
 * Manual "Email report again" action from the report page. Always sends to
 * the currently authenticated user's own registered email — the recipient
 * is never taken from the form, so there is no way to redirect the email to
 * anyone else's address.
 */
export async function resendReportEmailAction(
  examId: string,
  locale: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by useActionState's action signature
  _prevState: ResendReportEmailState,
): Promise<ResendReportEmailState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { status: "error", message: "unauthorized" };
  }

  // RLS scopes this to the caller's own school (or lets a super admin
  // through) — a missing row here means the exam doesn't exist or isn't
  // visible to this user.
  const { data: exam } = await supabase
    .from("exams")
    .select("id, title, class_name, exam_date, school_id")
    .eq("id", examId)
    .single();

  if (!exam) {
    return { status: "error", message: "not_found" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const numbers = await getExamReportNumbers(supabase, examId);

  const result = await notifyReportReady(supabase, {
    examId: exam.id,
    examTitle: exam.title,
    className: exam.class_name,
    examDate: exam.exam_date,
    schoolId: exam.school_id,
    numbers,
    recipientEmail: user.email,
    recipientName: profile?.full_name ?? "",
    locale,
    origin: await getOrigin(),
  });

  if (!result.ok) {
    return { status: "error", message: result.error ?? "send_failed" };
  }
  return { status: "success" };
}

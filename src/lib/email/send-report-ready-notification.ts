import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { countFailedStudents } from "@/lib/analysis/exam-analytics";
import type { ExamReportNumbers } from "@/lib/reports/exam-report-data";
import { generateExamReportPdf, examReportPdfFilename } from "@/lib/pdf/generate-exam-report-pdf";
import type { AiExamSummary } from "@/lib/ai/generate-exam-summary";
import { sendReportReadyEmail, type SendReportReadyEmailResult } from "./send-report-ready-email";

type Supa = SupabaseClient<Database>;

export type NotifyReportReadyInput = {
  examId: string;
  examTitle: string;
  className: string;
  examDate: string | null;
  schoolId: string;
  numbers: ExamReportNumbers;
  recipientEmail: string;
  recipientName: string;
  locale: string;
  origin: string;
};

/**
 * Looks up the school's display name, renders the same branded PDF the
 * download button produces, and sends the "report is ready" email — always
 * to the given recipient, which callers must have already verified is the
 * currently authenticated user. Shared by the automatic send-on-analysis
 * path and the manual "Email report again" button so both produce the exact
 * same email and the exact same PDF from the exact same numbers.
 *
 * PDF generation failure never blocks the email — the notification still
 * goes out without the attachment rather than not going out at all.
 */
export async function notifyReportReady(
  supabase: Supa,
  input: NotifyReportReadyInput,
): Promise<SendReportReadyEmailResult> {
  const [{ data: school }, { data: report }] = await Promise.all([
    supabase.from("schools").select("name").eq("id", input.schoolId).single(),
    supabase
      .from("reports")
      .select("ai_summary")
      .eq("exam_id", input.examId)
      .eq("type", "exam")
      .eq("language", input.locale)
      .maybeSingle(),
  ]);

  const schoolName = school?.name ?? "";

  let pdf: { buffer: Buffer; filename: string } | undefined;
  try {
    const buffer = await generateExamReportPdf({
      language: input.locale,
      schoolName,
      examTitle: input.examTitle,
      className: input.className,
      examDate: input.examDate,
      numbers: input.numbers,
      aiSummary: (report?.ai_summary as AiExamSummary | null) ?? null,
    });
    pdf = { buffer, filename: examReportPdfFilename(input.examTitle) };
  } catch {
    pdf = undefined;
  }

  return sendReportReadyEmail({
    schoolId: input.schoolId,
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName,
    schoolName,
    className: input.className,
    examTitle: input.examTitle,
    classAverage: input.numbers.summary?.class_average ?? null,
    passRate: input.numbers.summary?.pass_rate ?? null,
    failedStudentsCount: countFailedStudents(input.numbers.students),
    reportUrl: `${input.origin}/${input.locale}/exams/${input.examId}`,
    language: input.locale,
    pdf,
  });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getExamReportNumbers } from "@/lib/reports/exam-report-data";
import { generateExamReportPdf, examReportPdfFilename } from "@/lib/pdf/generate-exam-report-pdf";
import type { AiExamSummary } from "@/lib/ai/generate-exam-summary";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; examId: string }> },
) {
  const { locale, examId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // RLS scopes this to the caller's own school regardless — a missing row
  // here means either the exam doesn't exist or it isn't theirs.
  const { data: exam } = await supabase
    .from("exams")
    .select("id, title, class_name, exam_date, school_id")
    .eq("id", examId)
    .single();

  if (!exam) {
    return new NextResponse("Not found", { status: 404 });
  }

  const [{ data: school }, numbers, { data: report }] = await Promise.all([
    supabase.from("schools").select("name").eq("id", exam.school_id).single(),
    getExamReportNumbers(supabase, examId),
    supabase
      .from("reports")
      .select("ai_summary")
      .eq("exam_id", examId)
      .eq("type", "exam")
      .eq("language", locale)
      .maybeSingle(),
  ]);

  const buffer = await generateExamReportPdf({
    language: locale,
    schoolName: school?.name ?? "",
    examTitle: exam.title,
    className: exam.class_name,
    examDate: exam.exam_date,
    numbers,
    aiSummary: (report?.ai_summary as AiExamSummary | null) ?? null,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${examReportPdfFilename(exam.title)}"`,
    },
  });
}

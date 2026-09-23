import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { ExamReportDocument } from "./exam-report-document";
import type { ExamReportNumbers } from "@/lib/reports/exam-report-data";
import type { AiExamSummary } from "@/lib/ai/generate-exam-summary";

export type GenerateExamReportPdfInput = {
  language: string;
  schoolName: string;
  examTitle: string;
  className: string;
  examDate: string | null;
  numbers: ExamReportNumbers;
  aiSummary: AiExamSummary | null;
};

/**
 * Renders the exact same branded PDF document used by the download button
 * and the PDF route — the single source of truth for the report's PDF
 * layout, also reused when attaching the report to an email.
 */
export async function generateExamReportPdf(input: GenerateExamReportPdfInput): Promise<Buffer> {
  return renderToBuffer(
    <ExamReportDocument
      language={input.language}
      schoolName={input.schoolName}
      examTitle={input.examTitle}
      className={input.className}
      examDate={input.examDate}
      summary={input.numbers.summary}
      subjects={input.numbers.subjects}
      students={input.numbers.students}
      studentSubjectMarks={input.numbers.studentSubjectMarks}
      examMaxMark={input.numbers.examMaxMark}
      topPerformers={input.numbers.topPerformers}
      strugglingStudents={input.numbers.strugglingStudents}
      dataIntegrityAlerts={input.numbers.dataIntegrityAlerts}
      aiSummary={input.aiSummary}
    />,
  );
}

/** A safe, human-readable .pdf filename derived from the exam title. */
export function examReportPdfFilename(examTitle: string): string {
  const safe = examTitle.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "exam-report";
  return `${safe}.pdf`;
}

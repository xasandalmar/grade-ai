import * as XLSX from "xlsx";
import type { ParsedExamFile, ParsedRow, RowErrorCode } from "./types";
import { analyzeExamSheet } from "@/lib/ai/analyze-exam-sheet";

/**
 * Parses an uploaded exam-results file (.xlsx, .xls, .csv) into rows ready
 * for preview. Nothing is written to the database here — validation only.
 *
 * There is no bespoke header/column/regex parser, and no deterministic
 * line-count or student-count gate either. The sheet's raw text (every row,
 * exactly as exported — title rows, odd headers, serial numbers and all) is
 * handed to GPT-5.6 Luna in one call, which reads it the way a person would:
 * it finds the real header row, reconstructs any awkward or wrapped student
 * names, correctly sums CAT1/CAT2/Final-style components per subject, and
 * never confuses the sheet's own pre-computed Total/%/Grade column for an
 * actual subject. See lib/ai/analyze-exam-sheet.ts for the exact
 * instructions given to the model, including the explicit "never omit a
 * row" instruction and the finish_reason check that catches a response the
 * API itself cut off mid-stream.
 *
 * A lightweight, deterministic pass still runs afterwards on whatever rows
 * the model returned — never to re-parse or re-decide anything it already
 * resolved, only to catch a structurally impossible mark (outside
 * 0..maxMark) or a duplicate/missing student name so it's visible to the
 * user before anything is saved.
 */
export async function parseExamFile(buffer: ArrayBuffer, maxMark: number): Promise<ParsedExamFile> {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return { ok: false, fileError: "unreadable_file" };
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet) {
    return { ok: false, fileError: "unreadable_file" };
  }

  const rawText = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
  if (!rawText.trim()) {
    return { ok: false, fileError: "no_rows" };
  }

  const result = await analyzeExamSheet(rawText, maxMark);
  if (!result.ok) {
    return { ok: false, fileError: result.reason === "truncated" ? "rows_omitted" : "ai_analysis_failed" };
  }

  const { analysis } = result;
  if (analysis.students.length === 0 || analysis.subjects.length === 0) {
    return { ok: false, fileError: "ai_analysis_failed" };
  }

  const seenKeys = new Set<string>();
  const rows: ParsedRow[] = analysis.students.map((student, i) => {
    const studentName = student.name.trim();
    const studentCode = student.code?.trim() || null;

    const rowErrors: RowErrorCode[] = [];
    if (!studentName) rowErrors.push("missing_name");

    const dedupeKey = (studentCode ?? studentName).toLowerCase();
    if (dedupeKey) {
      if (seenKeys.has(dedupeKey)) {
        rowErrors.push("duplicate_student");
      } else {
        seenKeys.add(dedupeKey);
      }
    }

    const marks: Record<string, number | null> = {};
    const components: Record<string, Record<string, number>> = {};

    for (const entry of student.marks) {
      // A structurally impossible mark (outside 0..maxMark) is dropped to
      // null rather than trusted — the model was explicitly told to stay in
      // range, so this only ever fires on a genuine mistake, and a missing
      // mark is always safer than a wrong one.
      const mark =
        entry.mark != null && entry.mark >= 0 && entry.mark <= maxMark ? entry.mark : null;
      marks[entry.subject] = mark;

      if (entry.components.length > 0) {
        const subjectComponents: Record<string, number> = {};
        for (const c of entry.components) {
          // Lowercased regardless of how the model cased it in the source
          // sheet ("CAT1", "Cat 1", ...) — the term-trend chart's chronological
          // ordering (opener → CAT1 → CAT2 → ... → final) matches on the exact
          // lowercase key, so an inconsistent case here would silently break
          // the ordering rather than error.
          const term = c.term.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
          if (term && c.value >= 0) subjectComponents[term] = c.value;
        }
        if (Object.keys(subjectComponents).length > 0) {
          components[entry.subject] = subjectComponents;
        }
      }
    }

    return {
      rowNumber: i + 1,
      studentCode,
      studentName,
      marks,
      components,
      rowErrors,
      cellErrors: [],
    };
  });

  const hasErrors = rows.some((row) => row.rowErrors.length > 0);

  return { ok: true, subjects: analysis.subjects, rows, hasErrors };
}

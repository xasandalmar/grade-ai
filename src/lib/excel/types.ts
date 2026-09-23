export type CellErrorCode = "invalid_mark" | "mark_above_max";
export type RowErrorCode = "missing_name" | "duplicate_student";
export type FileErrorCode =
  | "unreadable_file"
  | "no_rows"
  | "ai_unavailable"
  | "ai_analysis_failed"
  | "rows_omitted";

export type CellError = {
  subject: string;
  code: CellErrorCode;
};

export type ParsedRow = {
  rowNumber: number;
  studentCode: string | null;
  studentName: string;
  marks: Record<string, number | null>;
  /** Raw per-term marks (e.g. { cat1: 12, cat2: 13, final: 60 }) for subjects
   * that had CAT1/CAT2/Final-style sub-columns. Only present for subjects
   * where a breakdown existed — absent for plain single-column subjects. */
  components: Record<string, Record<string, number>>;
  rowErrors: RowErrorCode[];
  cellErrors: CellError[];
};

export type ParsedExamFile =
  | { ok: true; subjects: string[]; rows: ParsedRow[]; hasErrors: boolean }
  | { ok: false; fileError: FileErrorCode };

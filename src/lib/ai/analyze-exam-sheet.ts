import "server-only";
import { z } from "zod";
import { getOpenAIClient, OPENAI_MODEL } from "./openai-client";

const componentSchema = z.object({
  term: z.string(),
  value: z.number(),
});

const subjectMarkSchema = z.object({
  subject: z.string(),
  mark: z.number().nullable(),
  components: z.array(componentSchema),
});

const studentSchema = z.object({
  name: z.string(),
  code: z.string().nullable(),
  marks: z.array(subjectMarkSchema),
});

const analysisSchema = z.object({
  subjects: z.array(z.string()),
  students: z.array(studentSchema),
});

export type AiExamStudent = z.infer<typeof studentSchema>;
export type AiExamAnalysis = z.infer<typeof analysisSchema>;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    subjects: { type: "array", items: { type: "string" } },
    students: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          code: { type: ["string", "null"] },
          marks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                subject: { type: "string" },
                mark: { type: ["number", "null"] },
                components: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      term: { type: "string" },
                      value: { type: "number" },
                    },
                    required: ["term", "value"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["subject", "mark", "components"],
              additionalProperties: false,
            },
          },
        },
        required: ["name", "code", "marks"],
        additionalProperties: false,
      },
    },
  },
  required: ["subjects", "students"],
  additionalProperties: false,
} as const;

// Generous headroom for large classes: a student with ~6 subjects (each with
// up to 3 components) is roughly 250-350 output tokens as JSON, so this
// covers well over 500 students in one response. Explicit on purpose — an
// unset/default limit is exactly what lets a large sheet get silently cut
// off mid-response.
const MAX_OUTPUT_TOKENS = 32000;

export type AnalyzeExamSheetResult =
  | { ok: true; analysis: AiExamAnalysis }
  | { ok: false; reason: "not_configured" | "truncated" | "empty_response" | "invalid_response" | "request_failed" };

/**
 * The entire exam-sheet ingestion pipeline in one call: given the sheet's raw
 * text (every row, exactly as exported — title rows, odd headers, serial
 * numbers and all) and the exam's max mark, GPT-5.6 Luna reads it the way a
 * person would and returns every student with one clean, normalized mark per
 * subject. There is no separate deterministic header/column parser anymore —
 * this model call IS the parser.
 *
 * Never silently drops rows: the response's finish_reason is checked, and a
 * response cut off by the token limit (finish_reason === "length") is
 * treated as a hard failure rather than returned as a partial, truncated
 * result — callers additionally cross-check the returned row count against
 * the sheet's own line count (see parse-exam-file.ts) as a second,
 * independent guard.
 */
export async function analyzeExamSheet(
  rawText: string,
  maxMark: number,
): Promise<AnalyzeExamSheetResult> {
  const client = getOpenAIClient();
  if (!client) return { ok: false, reason: "not_configured" };

  const systemPrompt = [
    "You are analyzing a raw school exam mark sheet, dumped below as plain CSV-like text exactly as exported from the original spreadsheet.",
    "Real sheets are messy: title/term/school-name rows above the real header, inconsistent column naming, serial-number columns, remarks columns, and one or more mark components per subject (e.g. CAT1, CAT2, Final, Total). A student's name may occasionally be awkwardly split, wrapped, or combined with their ID in one cell — use your judgment to reconstruct each student's real full name and ID correctly.",
    `For every real student row, extract: their full name, their ID/admission number if the sheet has one (else null), and for every subject with marks, one final numeric mark for that subject out of ${maxMark}.`,
    'CAT1, CAT2, Final, Opener, Midterm, End Term, and similarly named columns are each a real, individual component of a subject\'s mark — every one of them, INCLUDING "Final", must always be reported as its own entry under "components" with its own term key (e.g. "cat1", "cat2", "final"). Never merge two components into one, and never leave "Final" (or any other real component that is present in the sheet) out of the components list — the chronological CAT1 → CAT2 → Final trend depends on every single component being reported. Sum every one of a subject\'s components together to get that subject\'s final mark.',
    'A subject that only ever had ONE flat mark column (no CAT1/CAT2/Final-style breakdown at all) gets components: [] — a genuinely empty array. Never invent a placeholder component (e.g. one named "mark" or "total") just to wrap that single value; only report a components entry when the sheet itself actually broke that subject into more than one column.',
    "The one thing that is NOT a component is the sheet's own separate pre-computed summary column — a column literally named just \"Total\", \"Grand Total\", \"Overall Total\", \"%\", \"Percentage\", \"Average\", \"Grade\", \"Division\", \"Aggregate\", or \"Position\", with no specific subject attached to it. That column is never a component, never a fake extra \"subject\", and its value is never added on top of the components you already summed — you compute the subject's mark yourself from its real components.",
    `Every mark you report must be a plain number between 0 and ${maxMark} inclusive. If a student is missing a subject's mark entirely, use null — never fabricate, estimate, or interpolate a value that isn't actually in the text.`,
    "CRITICAL — every row matters: the sheet may contain many students, sometimes hundreds. You MUST include every single real student row present in the text below, in the order they appear, with no exceptions. Never omit, skip, sample, truncate, deduplicate, or summarize rows for brevity or length — not even if the list is long or repetitive. A partial result is not acceptable; process the ENTIRE sheet from the first student row to the last. Never invent a student, a subject, or a row that isn't really present in the text.",
  ].join(" ");

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawText },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "exam_sheet_analysis", schema: JSON_SCHEMA, strict: true },
      },
      max_completion_tokens: MAX_OUTPUT_TOKENS,
    });

    const choice = response.choices[0];
    // The model ran out of output budget mid-response — the JSON is almost
    // certainly incomplete/invalid, and even if it happened to parse, it
    // would be a silently truncated student list. Treat as a hard failure,
    // never as a partial success.
    if (choice?.finish_reason === "length") {
      return { ok: false, reason: "truncated" };
    }

    const raw = choice?.message?.content;
    if (!raw) return { ok: false, reason: "empty_response" };

    const parsed = analysisSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { ok: false, reason: "invalid_response" };
    return { ok: true, analysis: parsed.data };
  } catch {
    return { ok: false, reason: "request_failed" };
  }
}

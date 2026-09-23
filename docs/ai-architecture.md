# Grade AI — AI Architecture

Model: **GPT-5.6 Luna**, called only from server-side code via `lib/ai/openai-client.ts`,
configured by server-only env vars `OPENAI_API_KEY` / `OPENAI_MODEL=gpt-5.6-luna`.

## Rule zero

The AI never computes statistics and never has direct database/SQL access. Every number it
narrates was computed by the app/DB first (see the `v_exam_*_stats` views in
[database.md](database.md)) and handed to it as verified structured input. The system prompt
additionally instructs the model to only use the data it was given and to say a stat isn't
available rather than invent one — but the real enforcement is architectural: the model has
no path to data it wasn't explicitly given.

## Two surfaces

### 1. Report writing (Phase 5)

One-shot generation of the narrative sections required by the spec (executive summary, class
performance, top students, students requiring attention, strong/weak subjects, subject
insights, student performance insights, recommendations). Input: the relevant
`v_exam_*_stats` rows (already computed) serialized as JSON, plus the requested report
language (`en` / `so` / `ar`). Output: structured JSON matching a fixed schema (so it can be
rendered consistently into the UI and the PDF), not free text — validated with `zod` before
it's stored in `reports.ai_summary` and before the report is marked `generated`.

### 2. AI Assistant (Phase 6)

A chat interface using OpenAI function-calling with a **fixed allow-list** of tools:

| tool | server implementation |
|---|---|
| `get_class_performance(class_id, exam_id)` | reads `v_exam_class_stats`, scoped to caller's `school_id` |
| `get_student_performance(student_id, exam_id)` | reads `v_exam_student_stats` |
| `get_subject_performance(subject_id, exam_id)` | reads `v_exam_subject_stats` |
| `get_top_students(exam_id, limit)` | ranked `v_exam_student_stats` |
| `get_failed_students(exam_id, subject_id?)` | `exam_results` joined against pass mark |
| `generate_student_report(student_id, exam_id, language)` | reuses the Phase 5 report writer |
| `generate_class_report(class_id, exam_id, language)` | reuses the Phase 5 report writer |

Every tool implementation takes the caller's `school_id` from the authenticated session — not
from the model's function-call arguments — and filters/`404`s anything outside it. If the
model asks for an entity that doesn't resolve inside the caller's school (e.g. a student id
belonging to another tenant, or a hallucinated id), the tool returns "not found", not another
tenant's data.

Ambiguous requests (e.g. "generate a report for Ahmed Ali" when multiple students share that
name) are resolved by the tool returning the candidate list and asking the assistant to prompt
the user to pick one — the model must not guess, matching the spec's requirement in section 7.

## Conversation persistence

`ai_conversations` / `ai_messages` store the chat history per school/user so the assistant
page can show past conversations; tool calls and their (already-authorized) results are
stored alongside for traceability, feeding the super admin's "AI usage" stat and
`audit_logs`.

## Language

Both surfaces accept a `language: 'en' | 'so' | 'ar'` parameter; the system prompt asks the
model to write in that language, and the UI wraps Arabic output in `dir="rtl"`. Numbers,
student names and other verified fields are passed through unchanged — only the narrative
text is translated by the model.

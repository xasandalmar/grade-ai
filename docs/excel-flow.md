# Grade AI — Excel Upload Flow

Supports `.xlsx`, `.xls`, `.csv` via the `xlsx` (SheetJS) library, parsed server-side.

```
Upload → Read → Validate → Preview → Confirm → Save → Analyze
```

1. **Upload** — user picks a file on an exam's upload page and selects/confirms the target
   class + which subject columns map to which `subjects` rows (new subject names can be
   created inline).
2. **Read** — the file is parsed server-side (Route Handler, in-memory, never written to
   disk/Storage) into rows: `{ student_code, student_name, class, marks: { [subject]: value } }`.
3. **Validate** — before anything touches the database:
   - missing student name
   - duplicate student within the file (same code/name+class)
   - invalid mark (non-numeric, negative)
   - mark above the subject's max
   - missing class
   - missing/unrecognized subject columns
   Every problem is collected (not just the first) and attached to its row/column so the user
   can see exactly what's wrong. **Marks are never silently changed, clamped, or dropped.**
4. **Preview** — the parsed + validated table is rendered back to the user (valid rows and
   flagged rows both visible) before any write. Nothing is persisted yet.
5. **Confirm** — the user reviews the preview and explicitly confirms (or fixes the file and
   re-uploads). If there are blocking errors, confirm is disabled until resolved.
6. **Save** — on confirm, a single server-side transaction:
   - upserts `students` (new student codes/names for this school+class),
   - upserts `exam_subjects` for the exam,
   - inserts `exam_results` rows,
   - writes an `imports` row (`status='confirmed'`, `row_count`, any non-blocking warnings),
   - sets `exams.status = 'processing'`.
7. **Analyze** — after save, the stats views (`v_exam_*_stats`) are queried, the AI report is
   generated (Phase 5), `exams.status` becomes `analyzed`, a `reports` row is created, and the
   automatic email is sent (Phase 7) — see [email-architecture.md](email-architecture.md).

## Why no file storage (for now)

The spec doesn't ask for re-downloading the original spreadsheet, so the raw file is parsed
in-memory and discarded; `imports` keeps enough metadata (filename, row count, error report)
for audit purposes. If a future requirement needs the original file kept, the escape hatch is
a school-scoped Supabase Storage bucket with matching RLS — not needed for the current spec.

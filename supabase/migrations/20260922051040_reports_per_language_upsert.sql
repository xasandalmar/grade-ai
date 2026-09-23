-- One exam-level report row per language, so switching the report's language
-- caches (and reuses) each language's AI summary instead of regenerating or
-- overwriting a previous one.
alter table public.reports
  add constraint reports_exam_type_language_unique unique (exam_id, type, language);

-- Needed so a language's report row can be upserted (created the first time
-- it's viewed, then reused) rather than only ever inserted once.
create policy "update own school reports"
  on public.reports for update
  using (school_id = app.current_school_id())
  with check (school_id = app.current_school_id());

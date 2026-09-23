-- Preserve per-term component marks (CAT1, CAT2, Final, ...) alongside the
-- scored total, so trend analysis (CAT1 -> CAT2 -> Final) is possible instead
-- of only ever seeing the collapsed subject total.
alter table public.exam_results
  add column components jsonb;

comment on column public.exam_results.components is
  'Raw per-term component marks as parsed from the sheet, e.g. {"cat1":12,"cat2":13,"final":60}. Null when the sheet only had a single flat mark column for this subject.';

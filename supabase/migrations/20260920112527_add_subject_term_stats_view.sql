-- Per-subject, per-term (CAT1/CAT2/Final/...) average across the exam, unpivoted
-- from exam_results.components. Powers the "CAT1 vs CAT2 vs Final" trend view.
create view public.v_exam_subject_term_stats
with (security_invoker = true) as
select
  er.exam_id,
  er.subject_id,
  es.school_id,
  es.name as subject_name,
  kv.key as term_key,
  round(avg((kv.value)::numeric), 2) as average,
  count(*) as total_count
from public.exam_results er
join public.exam_subjects es on es.id = er.subject_id
cross join lateral jsonb_each_text(er.components) as kv(key, value)
where er.components is not null
group by er.exam_id, er.subject_id, es.school_id, es.name, kv.key;

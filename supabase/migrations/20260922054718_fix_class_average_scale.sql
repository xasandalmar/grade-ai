-- Bug: class_average was averaging each student's raw SUMMED total across all
-- subjects (e.g. 276 out of a 3-subject 300 max), producing numbers like
-- "199.33" that look like almost double a percentage and have nothing to do
-- with the exam's actual max mark (typically 100). Fixed to average each
-- student's per-subject average instead, which stays on the same 0-100(ish)
-- scale as an individual subject mark.
create or replace view public.v_exam_summary
with (security_invoker = true) as
with student_totals as (
  select
    er.exam_id,
    er.student_id,
    sum(er.mark) as total,
    count(*) as subject_count,
    bool_and(er.mark >= es.pass_mark) as all_passed
  from public.exam_results er
  join public.exam_subjects es on es.id = er.subject_id
  group by er.exam_id, er.student_id
)
select
  e.id as exam_id,
  e.school_id,
  count(distinct st.student_id) as student_count,
  (select count(*) from public.exam_subjects s where s.exam_id = e.id) as subject_count,
  round(avg(st.total / nullif(st.subject_count, 0)), 2) as class_average,
  round(count(*) filter (where st.all_passed)::numeric / nullif(count(*), 0) * 100, 2) as pass_rate,
  round(count(*) filter (where not st.all_passed)::numeric / nullif(count(*), 0) * 100, 2) as fail_rate
from public.exams e
left join student_totals st on st.exam_id = e.id
group by e.id, e.school_id;

create or replace view public.v_exam_student_stats
with (security_invoker = true) as
with agg as (
  select
    er.exam_id,
    er.student_id,
    sum(er.mark) as total,
    sum(es.max_mark) as max_total,
    count(*) as subject_count,
    count(*) filter (where er.mark >= es.pass_mark) as passed_count,
    count(*) filter (where er.mark < es.pass_mark) as failed_count
  from public.exam_results er
  join public.exam_subjects es on es.id = er.subject_id
  group by er.exam_id, er.student_id
),
strongest as (
  select distinct on (er.exam_id, er.student_id)
    er.exam_id, er.student_id, er.subject_id as strongest_subject_id
  from public.exam_results er
  join public.exam_subjects es on es.id = er.subject_id
  order by er.exam_id, er.student_id, (er.mark / nullif(es.max_mark, 0)) desc, es.name asc
),
weakest as (
  select distinct on (er.exam_id, er.student_id)
    er.exam_id, er.student_id, er.subject_id as weakest_subject_id
  from public.exam_results er
  join public.exam_subjects es on es.id = er.subject_id
  order by er.exam_id, er.student_id, (er.mark / nullif(es.max_mark, 0)) asc, es.name asc
)
select
  a.exam_id,
  a.student_id,
  st.school_id,
  st.full_name,
  st.student_code,
  a.total,
  round(a.total / nullif(a.subject_count, 0), 2) as average,
  round(a.total / nullif(a.max_total, 0) * 100, 2) as percentage,
  case
    when a.max_total = 0 then null
    when (a.total / a.max_total * 100) >= 80 then 'A'
    when (a.total / a.max_total * 100) >= 70 then 'B'
    when (a.total / a.max_total * 100) >= 60 then 'C'
    when (a.total / a.max_total * 100) >= 50 then 'D'
    else 'F'
  end as grade,
  rank() over (partition by a.exam_id order by a.total desc) as rank,
  a.subject_count,
  a.passed_count,
  a.failed_count,
  strongest.strongest_subject_id,
  weakest.weakest_subject_id,
  a.max_total
from agg a
join public.exam_students st on st.id = a.student_id
left join strongest on strongest.exam_id = a.exam_id and strongest.student_id = a.student_id
left join weakest on weakest.exam_id = a.exam_id and weakest.student_id = a.student_id;

-- Pivot: a single Upload -> Report flow. An exam upload IS the source of
-- truth — no separate manually-managed catalogs for academic years, classes,
-- subjects, or students. Subjects/students are scoped to the exam they were
-- uploaded with; a school re-uploads its roster with every exam.

-- ============================================================
-- exams: one row per uploaded result file.
-- ============================================================
create type public.exam_status as enum ('uploaded', 'analyzed', 'failed');

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  class_name text not null,
  exam_date date,
  file_name text,
  row_count int not null default 0,
  status public.exam_status not null default 'uploaded',
  created_at timestamptz not null default now()
);

create index exams_school_id_idx on public.exams(school_id);

alter table public.exams enable row level security;

create policy "select own school exams"
  on public.exams for select
  using (school_id = app.current_school_id() or app.is_super_admin());

create policy "insert own school exams"
  on public.exams for insert
  with check (school_id = app.current_school_id());

create policy "update own school exams"
  on public.exams for update
  using (school_id = app.current_school_id())
  with check (school_id = app.current_school_id());

create policy "delete own school exams"
  on public.exams for delete
  using (school_id = app.current_school_id());

-- ============================================================
-- exam_subjects: the subjects that appear in one exam upload
-- (columns detected in the sheet), not a shared catalog.
-- ============================================================
create table public.exam_subjects (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  max_mark numeric not null default 100 check (max_mark > 0),
  pass_mark numeric not null default 50 check (pass_mark >= 0),
  unique (exam_id, name)
);

create index exam_subjects_exam_id_idx on public.exam_subjects(exam_id);

alter table public.exam_subjects enable row level security;

create policy "select own school exam subjects"
  on public.exam_subjects for select
  using (school_id = app.current_school_id() or app.is_super_admin());

create policy "insert own school exam subjects"
  on public.exam_subjects for insert
  with check (school_id = app.current_school_id());

create policy "delete own school exam subjects"
  on public.exam_subjects for delete
  using (school_id = app.current_school_id());

-- ============================================================
-- exam_students: the roster as it appeared in this exam's upload.
-- ============================================================
create table public.exam_students (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  student_code text,
  full_name text not null,
  created_at timestamptz not null default now()
);

create index exam_students_exam_id_idx on public.exam_students(exam_id);
create unique index exam_students_unique_code_per_exam
  on public.exam_students(exam_id, student_code)
  where student_code is not null;

alter table public.exam_students enable row level security;

create policy "select own school exam students"
  on public.exam_students for select
  using (school_id = app.current_school_id() or app.is_super_admin());

create policy "insert own school exam students"
  on public.exam_students for insert
  with check (school_id = app.current_school_id());

create policy "delete own school exam students"
  on public.exam_students for delete
  using (school_id = app.current_school_id());

-- ============================================================
-- exam_results: the actual marks.
-- ============================================================
create table public.exam_results (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.exam_students(id) on delete cascade,
  subject_id uuid not null references public.exam_subjects(id) on delete cascade,
  mark numeric not null check (mark >= 0),
  unique (exam_id, student_id, subject_id)
);

create index exam_results_exam_id_idx on public.exam_results(exam_id);
create index exam_results_student_id_idx on public.exam_results(student_id);
create index exam_results_subject_id_idx on public.exam_results(subject_id);

alter table public.exam_results enable row level security;

create policy "select own school exam results"
  on public.exam_results for select
  using (school_id = app.current_school_id() or app.is_super_admin());

create policy "insert own school exam results"
  on public.exam_results for insert
  with check (school_id = app.current_school_id());

create policy "delete own school exam results"
  on public.exam_results for delete
  using (school_id = app.current_school_id());

-- ============================================================
-- reports: generated report snapshots (stats now, AI summary once
-- OpenAI is connected in a later phase; pdf_url once PDF export lands).
-- ============================================================
create type public.report_type as enum ('exam', 'student');
create type public.report_status as enum ('generated', 'failed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  type public.report_type not null,
  student_id uuid references public.exam_students(id) on delete cascade,
  language text not null default 'en',
  data jsonb not null,
  ai_summary jsonb,
  pdf_url text,
  status public.report_status not null default 'generated',
  created_at timestamptz not null default now()
);

create index reports_exam_id_idx on public.reports(exam_id);
create index reports_school_id_idx on public.reports(school_id);

alter table public.reports enable row level security;

create policy "select own school reports"
  on public.reports for select
  using (school_id = app.current_school_id() or app.is_super_admin());

create policy "insert own school reports"
  on public.reports for insert
  with check (school_id = app.current_school_id());

-- ============================================================
-- Computed statistics views. security_invoker = true is required so RLS on
-- the underlying tables applies for the querying user (not the view owner).
-- ============================================================
create view public.v_exam_subject_stats
with (security_invoker = true) as
select
  es.exam_id,
  es.id as subject_id,
  es.school_id,
  es.name,
  es.max_mark,
  es.pass_mark,
  round(avg(er.mark), 2) as average,
  max(er.mark) as highest,
  min(er.mark) as lowest,
  count(*) as total_count,
  count(*) filter (where er.mark >= es.pass_mark) as passed_count,
  count(*) filter (where er.mark < es.pass_mark) as failed_count,
  round(
    count(*) filter (where er.mark >= es.pass_mark)::numeric / nullif(count(*), 0) * 100,
    2
  ) as pass_rate
from public.exam_subjects es
join public.exam_results er on er.subject_id = es.id
group by es.exam_id, es.id, es.school_id, es.name, es.max_mark, es.pass_mark;

create view public.v_exam_student_stats
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
  weakest.weakest_subject_id
from agg a
join public.exam_students st on st.id = a.student_id
left join strongest on strongest.exam_id = a.exam_id and strongest.student_id = a.student_id
left join weakest on weakest.exam_id = a.exam_id and weakest.student_id = a.student_id;

create view public.v_exam_summary
with (security_invoker = true) as
with student_totals as (
  select
    er.exam_id,
    er.student_id,
    sum(er.mark) as total,
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
  round(avg(st.total), 2) as class_average,
  round(count(*) filter (where st.all_passed)::numeric / nullif(count(*), 0) * 100, 2) as pass_rate,
  round(count(*) filter (where not st.all_passed)::numeric / nullif(count(*), 0) * 100, 2) as fail_rate
from public.exams e
left join student_totals st on st.exam_id = e.id
group by e.id, e.school_id;

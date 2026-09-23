-- ============================================================
-- schools: the tenant root. One row per registered user's school.
-- ============================================================
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  address text,
  phone text,
  logo_url text,
  created_at timestamptz not null default now()
);

create index schools_owner_id_idx on public.schools(owner_id);

alter table public.schools enable row level security;

-- Now that schools exists, wire up the FK left open in Phase 2.
alter table public.profiles
  add constraint profiles_school_id_fkey foreign key (school_id) references public.schools(id) on delete set null;

create policy "select own school or super admin"
  on public.schools for select
  using (id = app.current_school_id() or app.is_super_admin());

create policy "update own school"
  on public.schools for update
  using (id = app.current_school_id())
  with check (id = app.current_school_id());

-- No direct insert/delete policy: schools are created via create_my_school() below
-- (SECURITY DEFINER), which atomically creates the row and links the owner's
-- profile in one transaction, and are never deleted through the app.

create or replace function public.create_my_school(p_name text, p_address text default null, p_phone text default null)
returns public.schools
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_existing uuid;
  v_school public.schools;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select school_id into v_existing from public.profiles where id = v_uid;
  if v_existing is not null then
    raise exception 'This account already belongs to a school';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'School name is required';
  end if;

  insert into public.schools (owner_id, name, address, phone)
  values (v_uid, trim(p_name), nullif(trim(coalesce(p_address, '')), ''), nullif(trim(coalesce(p_phone, '')), ''))
  returning * into v_school;

  update public.profiles set school_id = v_school.id where id = v_uid;

  return v_school;
end;
$$;

revoke execute on function public.create_my_school(text, text, text) from public;
grant execute on function public.create_my_school(text, text, text) to authenticated;

-- ============================================================
-- academic_years
-- ============================================================
create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

create index academic_years_school_id_idx on public.academic_years(school_id);

alter table public.academic_years enable row level security;

create policy "select own school academic years"
  on public.academic_years for select
  using (school_id = app.current_school_id() or app.is_super_admin());

create policy "insert own school academic years"
  on public.academic_years for insert
  with check (school_id = app.current_school_id());

create policy "update own school academic years"
  on public.academic_years for update
  using (school_id = app.current_school_id())
  with check (school_id = app.current_school_id());

create policy "delete own school academic years"
  on public.academic_years for delete
  using (school_id = app.current_school_id());

-- Only one "current" academic year per school.
create unique index academic_years_one_current_per_school
  on public.academic_years(school_id)
  where is_current;

-- ============================================================
-- classes
-- ============================================================
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now()
);

create index classes_school_id_idx on public.classes(school_id);
create index classes_academic_year_id_idx on public.classes(academic_year_id);

alter table public.classes enable row level security;

create policy "select own school classes"
  on public.classes for select
  using (school_id = app.current_school_id() or app.is_super_admin());

create policy "insert own school classes"
  on public.classes for insert
  with check (school_id = app.current_school_id());

create policy "update own school classes"
  on public.classes for update
  using (school_id = app.current_school_id())
  with check (school_id = app.current_school_id());

create policy "delete own school classes"
  on public.classes for delete
  using (school_id = app.current_school_id());

-- ============================================================
-- subjects
-- ============================================================
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  max_mark numeric not null default 100 check (max_mark > 0),
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create index subjects_school_id_idx on public.subjects(school_id);

alter table public.subjects enable row level security;

create policy "select own school subjects"
  on public.subjects for select
  using (school_id = app.current_school_id() or app.is_super_admin());

create policy "insert own school subjects"
  on public.subjects for insert
  with check (school_id = app.current_school_id());

create policy "update own school subjects"
  on public.subjects for update
  using (school_id = app.current_school_id())
  with check (school_id = app.current_school_id());

create policy "delete own school subjects"
  on public.subjects for delete
  using (school_id = app.current_school_id());

-- ============================================================
-- students
-- ============================================================
create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete restrict,
  student_code text,
  full_name text not null,
  created_at timestamptz not null default now()
);

create index students_school_id_idx on public.students(school_id);
create index students_class_id_idx on public.students(class_id);
create unique index students_unique_code_per_class
  on public.students(school_id, class_id, student_code)
  where student_code is not null;

alter table public.students enable row level security;

create policy "select own school students"
  on public.students for select
  using (school_id = app.current_school_id() or app.is_super_admin());

create policy "insert own school students"
  on public.students for insert
  with check (school_id = app.current_school_id());

create policy "update own school students"
  on public.students for update
  using (school_id = app.current_school_id())
  with check (school_id = app.current_school_id());

create policy "delete own school students"
  on public.students for delete
  using (school_id = app.current_school_id());

-- ============================================================
-- exams (metadata only in Phase 3; results/subjects wired up in Phase 4)
-- ============================================================
create type public.exam_status as enum ('draft', 'processing', 'analyzed', 'failed');

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  class_id uuid not null references public.classes(id) on delete restrict,
  name text not null,
  exam_date date,
  status public.exam_status not null default 'draft',
  created_at timestamptz not null default now()
);

create index exams_school_id_idx on public.exams(school_id);
create index exams_class_id_idx on public.exams(class_id);
create index exams_academic_year_id_idx on public.exams(academic_year_id);

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

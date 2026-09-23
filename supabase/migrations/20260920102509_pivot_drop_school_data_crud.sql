-- Pivot: discard the manual School Data CRUD (academic years, classes, subjects,
-- students, exams-as-a-catalog) in favor of a single Upload -> Report flow where
-- an exam upload IS the source of truth. Schools/profiles are untouched.

drop function if exists public.set_current_academic_year(uuid);

drop table if exists public.exams cascade;
drop table if exists public.students cascade;
drop table if exists public.subjects cascade;
drop table if exists public.classes cascade;
drop table if exists public.academic_years cascade;

drop type if exists public.exam_status;

-- Atomically switches which academic year is "current" for the caller's school.
-- SECURITY INVOKER (default): relies entirely on the caller's own RLS policies,
-- so it can never touch another school's rows.
create or replace function public.set_current_academic_year(p_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  update public.academic_years
    set is_current = false
    where school_id = app.current_school_id() and is_current = true and id <> p_id;

  update public.academic_years
    set is_current = true
    where id = p_id and school_id = app.current_school_id();
end;
$$;

revoke execute on function public.set_current_academic_year(uuid) from anon, public;
grant execute on function public.set_current_academic_year(uuid) to authenticated;

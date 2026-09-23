-- Wrap auth.uid() as (select auth.uid()) so Postgres evaluates it once per
-- query (initplan) instead of once per row. Applies to both the helper
-- functions (reused by every tenant table from Phase 3 onward) and the
-- profiles policies themselves.

create or replace function app.current_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id from public.profiles where id = (select auth.uid());
$$;

create or replace function app.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'super_admin' from public.profiles where id = (select auth.uid())), false);
$$;

drop policy "select own profile or super admin" on public.profiles;
create policy "select own profile or super admin"
  on public.profiles for select
  using (id = (select auth.uid()) or app.is_super_admin());

drop policy "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Schema for internal helper functions (kept separate from public)
create schema if not exists app;

-- Roles and account status
create type public.user_role as enum ('user', 'super_admin');
create type public.user_status as enum ('active', 'suspended', 'deactivated');

-- One row per Supabase Auth user.
-- school_id has no FK yet: the `schools` table is created in Phase 3, which
-- will add `alter table public.profiles add constraint profiles_school_id_fkey ...`
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid,
  full_name text not null default '',
  email text not null,
  role public.user_role not null default 'user',
  status public.user_status not null default 'active',
  last_active_at timestamptz,
  created_at timestamptz not null default now()
);

create index profiles_school_id_idx on public.profiles(school_id);

alter table public.profiles enable row level security;

-- Helper: current user's school_id (used by every tenant table's RLS from Phase 3 onward)
create or replace function app.current_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id from public.profiles where id = auth.uid();
$$;

-- Helper: is the current user a super admin
create or replace function app.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'super_admin' from public.profiles where id = auth.uid()), false);
$$;

-- A user can read their own profile; super admins can read everyone's (admin dashboard, Phase 8)
create policy "select own profile or super admin"
  on public.profiles for select
  using (id = auth.uid() or app.is_super_admin());

-- A user can update their own profile (e.g. full_name), but not their own role/status
create policy "update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'user'::public.user_role and status = 'active'::public.user_status);

-- No insert/delete policy for normal users: rows are created by the trigger below
-- (SECURITY DEFINER bypasses RLS) and never deleted directly (cascades from auth.users).

-- Bootstrap a profile row automatically whenever a new Supabase Auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync if the auth email ever changes
create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update on auth.users
  for each row execute function public.handle_user_email_update();

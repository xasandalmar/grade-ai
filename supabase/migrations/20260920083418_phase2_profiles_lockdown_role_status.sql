-- Replace the update policy: ownership is the only RLS concern.
-- Preventing self-escalation of role/status is handled by a trigger instead,
-- so it doesn't accidentally block a super_admin from editing their own profile.
drop policy "update own profile" on public.profiles;

create policy "update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function public.prevent_role_status_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The service-role key (used only by audited, server-only admin actions)
  -- is the sole caller allowed to change role/status.
  if auth.role() <> 'service_role' then
    new.role := old.role;
    new.status := old.status;
  end if;
  return new;
end;
$$;

create trigger lock_role_status_on_self_update
  before update on public.profiles
  for each row execute function public.prevent_role_status_self_escalation();

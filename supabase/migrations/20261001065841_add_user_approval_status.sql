-- User Approval System: a separate gate from the existing active/suspended/
-- deactivated lifecycle (which is for ongoing moderation by a super admin
-- AFTER approval). Kept as its own column rather than overloading `status`,
-- so the two concerns never collide and the existing suspend/reactivate
-- feature is completely unaffected.
create type public.user_approval_status as enum ('pending', 'approved', 'rejected');

alter table public.profiles
  add column approval_status public.user_approval_status not null default 'pending';

-- Every account that already existed before this gate was introduced is
-- grandfathered in as approved — the gate only applies to new signups from
-- here on, never retroactively locking out existing users.
update public.profiles set approval_status = 'approved';

create index profiles_approval_status_idx on public.profiles(approval_status);

-- Extend the existing role/status self-escalation guard to also cover
-- approval_status — otherwise a user could approve themselves by just
-- calling the PostgREST update endpoint directly. Same rule as role/status:
-- only the service-role key (used by audited, server-only admin actions)
-- may change it.
create or replace function public.prevent_role_status_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.role := old.role;
    new.status := old.status;
    new.approval_status := old.approval_status;
  end if;
  return new;
end;
$$;

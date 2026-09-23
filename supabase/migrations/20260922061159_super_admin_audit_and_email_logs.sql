-- Super Admin Dashboard support: platform-wide audit trail and a minimal
-- email-send log (so the "Emails Sent" stat is honest, not hardcoded).
-- Both are readable only by super admins; both are writable only via the
-- service-role key (server-only admin actions / server-only send-email code),
-- never by a normal authenticated user's own session.

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role public.user_role,
  school_id uuid references public.schools(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "select audit logs as super admin"
  on public.audit_logs for select
  to authenticated
  using (app.is_super_admin());

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_school_id_idx on public.audit_logs (school_id);

create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete set null,
  type text not null,
  recipient text not null,
  status text not null,
  provider_message_id text,
  error text,
  created_at timestamptz not null default now()
);

alter table public.email_logs enable row level security;

create policy "select email logs as super admin"
  on public.email_logs for select
  to authenticated
  using (app.is_super_admin());

create index email_logs_created_at_idx on public.email_logs (created_at desc);
create index email_logs_school_id_idx on public.email_logs (school_id);

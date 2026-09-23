# Grade AI — Database Design

Supabase project: `ijcygfuugpklzrorbpuz` (region eu-west-1, Postgres 17). Currently empty —
schema below is created via migrations in Phase 2–4.

## Tables

### `profiles`
One row per Supabase Auth user (`id` = `auth.users.id`).

| column | type | notes |
|---|---|---|
| id | uuid PK | references `auth.users(id)` |
| school_id | uuid FK → schools, nullable | null until onboarding completes |
| full_name | text | |
| email | text | mirrors `auth.users.email` for convenience |
| role | text enum: `user`, `super_admin` | default `user` |
| status | text enum: `active`, `suspended`, `deactivated` | default `active` |
| last_active_at | timestamptz | updated on login/activity |
| created_at | timestamptz | default now() |

Created automatically by a trigger on `auth.users` insert (`handle_new_user`).

### `schools`
| id | uuid PK |
| owner_id | uuid FK → profiles |
| name | text |
| address | text nullable |
| phone | text nullable |
| logo_url | text nullable |
| created_at | timestamptz |

### `academic_years`
`id, school_id, name, start_date, end_date, is_current bool, created_at`

### `classes`
`id, school_id, academic_year_id FK nullable, name, created_at`

### `subjects`
`id, school_id, name, max_mark numeric default 100, created_at`
Unique `(school_id, name)`.

### `students`
`id, school_id, class_id FK, student_code text nullable, full_name, created_at`
Unique `(school_id, class_id, student_code)` where `student_code is not null`.

### `exams`
`id, school_id, academic_year_id FK nullable, class_id FK, name, exam_date date, status text enum('draft','processing','analyzed','failed'), created_at`

### `exam_subjects`
Which subjects are part of an exam, with per-exam overrides.
`id, exam_id FK, subject_id FK, max_mark numeric, pass_mark numeric`
Unique `(exam_id, subject_id)`.

### `exam_results`
The actual marks — one row per student per subject per exam.
`id, exam_id FK, student_id FK, subject_id FK, mark numeric, created_at`
Unique `(exam_id, student_id, subject_id)`. `school_id` denormalized onto this table (and
`exam_subjects`, `students`) to keep RLS policies simple/fast (single-column equality
instead of a join per row).

### `imports`
Audit trail of every Excel upload.
`id, school_id, exam_id FK nullable, file_name, uploaded_by FK profiles, status text enum('parsed','validated','confirmed','failed'), row_count int, error_report jsonb, created_at`

### `reports`
Generated report snapshots (immutable once created — a historical record, not a live view).
`id, school_id, exam_id FK nullable, class_id FK nullable, student_id FK nullable, subject_id FK nullable, type text enum('class','subject','student','school'), language text enum('en','so','ar'), title text, data jsonb (the computed stats used), ai_summary jsonb (executive_summary, top_students, recommendations, …), pdf_url text nullable, status text enum('generated','failed'), created_by FK profiles, created_at`

### `ai_conversations`
`id, school_id, user_id FK profiles, title, created_at`

### `ai_messages`
`id, conversation_id FK, role text enum('user','assistant','tool'), content text, tool_calls jsonb nullable, created_at`

### `email_logs`
`id, school_id, user_id FK profiles nullable, type text enum('welcome','report_ready','report_resend'), recipient text, subject text, status text enum('sent','failed'), resend_id text nullable, error text nullable, created_at`

### `audit_logs`
Platform-wide (super admin visible), and per-school security-relevant events.
`id, actor_id FK profiles nullable, actor_role text, school_id uuid nullable, action text, target_table text nullable, target_id uuid nullable, metadata jsonb, created_at`

## Computed statistics — views, not AI

```
v_exam_subject_stats(exam_id, subject_id, school_id,
  average, highest, lowest, pass_rate, fail_rate, passed_count, failed_count)

v_exam_student_stats(exam_id, student_id, school_id,
  total, average, percentage, grade, rank,
  passed_subjects, failed_subjects, strongest_subject_id, weakest_subject_id)

v_exam_class_stats(exam_id, class_id, school_id,
  student_count, class_average, pass_rate, fail_rate,
  highest_student_id, lowest_student_id,
  strongest_subject_id, weakest_subject_id)
```

`rank` uses `RANK() OVER (PARTITION BY exam_id ORDER BY total DESC)`. Grade uses a `CASE`
on percentage against the default scale (see architecture.md open decisions). These views
are the single source of truth handed to the AI report writer and the AI assistant tools —
the model never computes a number itself.

## Row Level Security (plan)

Two `SECURITY DEFINER` helper functions (schema `auth` is reserved by Supabase, so these
live in `public` or a dedicated `app` schema):

```sql
app.current_school_id() returns uuid   -- profiles.school_id for auth.uid()
app.is_super_admin() returns boolean   -- profiles.role = 'super_admin' for auth.uid()
```

Standard policy shape per tenant table:

```sql
alter table exam_results enable row level security;

create policy "select own school or super admin"
  on exam_results for select
  using (school_id = app.current_school_id() or app.is_super_admin());

create policy "write own school only"
  on exam_results for insert with check (school_id = app.current_school_id());

create policy "update own school only"
  on exam_results for update using (school_id = app.current_school_id());

create policy "delete own school only"
  on exam_results for delete using (school_id = app.current_school_id());
```

Super admins get **read** access everywhere for the admin dashboard, but write actions on
another school's data are never granted via RLS — admin actions that must mutate cross-tenant
state (activate/suspend a user) go through a server route using the service-role key, with
every call recorded in `audit_logs`.

`profiles`: a user can `select`/`update` only their own row; super admin can `select` all
rows (needed for the admin user list) but cannot arbitrarily `update` other profiles via RLS —
suspend/activate goes through an audited service-role server action instead.

## Indexes

- FK columns (`school_id`, `class_id`, `exam_id`, `student_id`, `subject_id`) on every table
  that has them.
- `exam_results(exam_id, student_id)`, `exam_results(exam_id, subject_id)` — stats queries.
  `exam_results(exam_id, student_id, subject_id)` unique already covers most lookups.
- `reports(school_id, created_at desc)` — report history listing.
- `audit_logs(created_at desc)`, `audit_logs(school_id)`.

## Migrations

Managed via Supabase MCP (`apply_migration`) starting in Phase 2 (profiles/auth) and
extended in Phase 3 (school data) and Phase 4 (exams/results/views). Each migration is a
small, named, forward-only SQL file under `supabase/migrations/`.

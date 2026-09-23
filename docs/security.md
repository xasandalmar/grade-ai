# Grade AI — Security Plan

## Critical invariant

**User A must never see User B's school, students, exams, or reports.** Every tenant table
has `school_id` + RLS (see [database.md](database.md)). Every server route additionally
re-derives `school_id` from the authenticated session — it is never taken from client input
(no trusting a `school_id` in a request body or query string).

## Secrets

Server-only, set in Vercel project env vars (never `NEXT_PUBLIC_*`):

- `OPENAI_API_KEY`, `OPENAI_MODEL` (`gpt-5.6-luna`)
- `RESEND_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Client-safe (already public by design):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The service-role client (`lib/supabase/admin.ts`) is imported only in server-only files
(Route Handlers / Server Actions marked `"use server"`), and only used for: (a) the
`handle_new_user` bootstrap, (b) super-admin actions that must cross tenant boundaries
(activate/suspend/deactivate a user), (c) any scheduled/cron-style job. It is never used to
serve a normal user's own data — normal reads/writes go through the RLS-bound client so a
bug can't accidentally leak cross-tenant data.

## AuthN / AuthZ

- Supabase Auth (email/password) via `@supabase/ssr`, session cookie refreshed in
  `middleware.ts`.
- `middleware.ts` gates `(dashboard)/*` (must be signed in) and `(admin)/*` (must be signed
  in **and** `profiles.role = 'super_admin'`, checked server-side, not just hidden in the UI).
- Every admin Route Handler re-checks the role server-side before touching the service-role
  client — the middleware check alone is not treated as sufficient.

## Input validation

- Every Route Handler / Server Action validates its input with a `zod` schema before touching
  the DB or calling OpenAI/Resend.
- Excel import: strict validation before any DB write — missing names, duplicate students in
  the file, non-numeric/negative marks, marks above the subject's max, missing class, missing
  subject columns. Marks are **never** silently coerced or clamped; invalid rows are surfaced
  to the user in the preview step for correction/re-upload.

## Rate limiting

Applied at minimum to: Excel upload/import confirm, AI report generation, AI assistant chat.
Plan: a simple Postgres-backed or in-memory sliding-window limiter keyed by `user_id`
(Vercel edge/serverless-friendly; revisit with Upstash/Redis if usage grows).

## Audit logging

`audit_logs` records: login (optional, if cheap to capture), school/class/exam mutations
worth tracking, all super-admin actions (activate/suspend/deactivate, viewing another
school's data), and AI/report generation events used for the admin "AI usage" stat.

## AI-specific security

See [ai-architecture.md](ai-architecture.md) — the model never gets DB/SQL access; every
"tool" it can call is a fixed server function that re-applies the caller's `school_id`, so a
prompt-injected or hallucinated request for another school's data is structurally impossible,
not just discouraged by prompt wording.

## Dependency / secret hygiene

- `.env`, `.env.local` etc. are git-ignored from the first commit; only `.env.example`
  (names, no values) is committed.
- No API keys are hard-coded; nothing is logged that contains a secret or a full mark sheet
  of another tenant.

## Testing before Phase 9 sign-off

- Supabase advisors (`get_advisors` for `security` and `performance`) run after each schema
  change, not just once at the end.
- Manual two-tenant test: create two schools/users, confirm neither can read/write the
  other's classes/students/exams/reports via the API (both through the UI and by calling the
  Route Handlers directly with the "wrong" session).
- Confirm no secret appears in any client bundle (`next build` output / browser devtools
  network tab) before deploying.

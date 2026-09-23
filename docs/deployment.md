# Grade AI — Deployment Architecture

## Current state of connected tools (verified during Phase 0)

| tool | status |
|---|---|
| Supabase | **Connected.** Project `ijcygfuugpklzrorbpuz` ("xasandalmardev@gmail.com's Project"), region eu-west-1, Postgres 17, `ACTIVE_HEALTHY`, currently **no tables** (fresh). |
| Vercel | **Connected.** Team "Hassan Dalmar" (`hassan-dalmar1`) accessible via MCP. No project created for Grade AI yet. |
| Resend | **Connected.** No sending domain verified yet (see [email-architecture.md](email-architecture.md)). |
| GitHub | **Not yet authorized** in this session (the GitHub MCP plugin needs the user to complete auth via `claude mcp` / `/mcp`, or a local `gh`/`git remote` can be used instead). No git repository exists locally yet either. |
| OpenAI | Spec states the key is already available/configured by the project owner, but no key/config was found in this (currently empty) project directory. Per the build instructions, this will be explicitly requested when Phase 5 (OpenAI integration) begins, rather than assumed. |

## Target pipeline

```
GitHub repo ──push──► Vercel (build: next build, tsc, eslint) ──► Production deployment
     ▲                                                                     │
     └── local dev (this machine) ────────────────────────────────────────┘
Supabase (migrations via MCP) ── env vars (URL, anon key, service-role key) ──► Vercel
Resend / OpenAI API keys ────────────────────────────────────────────────────► Vercel (server-only)
```

- Repository will be created and pushed to GitHub once the GitHub integration is authorized
  (or the user supplies a repo to push to).
- Vercel project will be linked to that repo; environment variables set via the Vercel MCP
  (`create_project_env`), never committed to the repo.
- Supabase schema changes are applied via the Supabase MCP (`apply_migration`), with
  `supabase/migrations/*.sql` kept in the repo as the source of truth.
- Local dev server: before starting, check the default port (3000) is free and pick another
  if not; report whichever port is actually used.

## Env vars (Vercel + local `.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only
OPENAI_API_KEY=                   # server-only
OPENAI_MODEL=gpt-5.6-luna         # server-only
RESEND_API_KEY=                   # server-only
```

`.env.local` is git-ignored from the very first commit; only `.env.example` (keys, no
values) is committed.

## Phase 9 checklist (for later)

- `next build` clean, `tsc --noEmit` clean, `eslint` clean.
- Supabase advisors clean (security + performance).
- Two-tenant RLS isolation test passes.
- Mobile/tablet/desktop responsive check.
- All three locales + Arabic RTL check.
- PDF generation + email sending smoke-tested in production.

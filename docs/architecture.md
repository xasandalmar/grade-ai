# Grade AI — Application Architecture

## Stack

- Next.js (App Router, TypeScript) — deployed to Vercel
- Tailwind CSS — UI, light/dark mode
- Supabase — Postgres, Auth, RLS, (optionally Storage later)
- OpenAI (`GPT-5.6 Luna`) — report writing + AI assistant, server-side only
- Resend — transactional email
- next-intl (or equivalent) — i18n for English / Somali / Arabic, RTL for Arabic

## Tenancy model

The tenant boundary is the **school**. Each registered user (`profiles` row) belongs to
exactly one `school` (`profiles.school_id`). All data tables (`classes`, `subjects`,
`students`, `exams`, `exam_results`, `reports`, `ai_conversations`, `email_logs`, …) carry
a `school_id` and are protected by RLS keyed off the authenticated user's `school_id`.
Super admins are a separate role (`profiles.role = 'super_admin'`) with platform-wide,
read-mostly access, enforced by a dedicated RLS branch and double-checked server-side —
never trusted from the client alone.

## High-level request flow

```
Browser (Next.js client components)
   │  Supabase session cookie (via @supabase/ssr)
   ▼
Next.js middleware — refreshes session, gates (dashboard)/(admin) route groups
   ▼
Route Handlers / Server Actions (server-only)
   │  - validate input (zod)
   │  - use RLS-bound Supabase client (user's JWT) for tenant data
   │  - use service-role client ONLY for: super-admin reads, triggers/cron-like jobs
   │  - call OpenAI / Resend with server-only env vars
   ▼
Supabase Postgres (RLS enforced) ──────────────► OpenAI API (server-only)
                                  ──────────────► Resend API (server-only)
```

No secret (`OPENAI_API_KEY`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) is ever sent to
the browser or placed in a `NEXT_PUBLIC_*` variable.

## Folder structure (planned)

```
grade-ai/
  src/
    app/
      (auth)/
        login/
        register/
        forgot-password/
        reset-password/
      (dashboard)/
        dashboard/
        schools/                setup / school profile
        academic-years/
        classes/
        subjects/
        students/
        exams/
          [examId]/upload/      excel upload → preview → confirm
          [examId]/analysis/
        reports/
          [reportId]/
        ai-assistant/
        settings/
      (admin)/
        admin/
          users/
          audit-logs/
          stats/
      api/
        imports/                excel parse + validate + confirm
        analysis/                trigger recompute
        reports/                generate / download / email-again
        ai/chat/                 assistant tool-calling endpoint
        ai/report/                report-writing endpoint
        admin/                   super-admin actions (service-role)
      layout.tsx
      globals.css
    components/
      ui/            base primitives (button, card, table, dialog, …)
      dashboard/      stat tiles, recent reports
      charts/         class/subject/pass-fail/top-students charts
      reports/        report viewer, language switcher, download/print
      forms/
    lib/
      supabase/
        client.ts      browser client (anon key)
        server.ts       RSC/server-action client (user JWT via cookies)
        admin.ts         service-role client, server-only, admin/cron use only
      excel/            parse + validate (xlsx/xls/csv)
      analysis/          calculation helpers (mirrors SQL views for reuse)
      ai/
        openai-client.ts
        tools/           function-calling tool implementations (server-only)
        prompts/
      pdf/                report → PDF rendering
      email/
        resend-client.ts
        templates/
      i18n/
        locales/en.json, so.json, ar.json
      validation/         zod schemas
      utils/
    types/
    middleware.ts
  supabase/
    migrations/
  docs/
  public/
```

## Key architectural decisions

1. **Calculations happen in Postgres/SQL views, not in the AI.** `v_exam_student_stats`,
   `v_exam_class_stats`, `v_exam_subject_stats` compute totals, averages, ranks, pass/fail —
   see [database.md](database.md). The AI only narrates numbers it is handed.
2. **AI never has raw DB/SQL access.** All AI data access goes through a small, fixed set
   of server-side "tools" that re-apply the authenticated user's `school_id` — see
   [ai-architecture.md](ai-architecture.md).
3. **PDF via `@react-pdf/renderer`**, not headless-browser screenshotting, so report
   generation stays serverless-friendly on Vercel.
4. **Excel files are parsed in-memory** on the server (Route Handler), never trusted, and
   nothing is written to the DB until the user explicitly confirms the previewed import —
   see [excel-flow.md](excel-flow.md).
5. **i18n is a proper library (next-intl-style), not inline strings.** Arabic renders with
   `dir="rtl"` at the document root when the active locale is `ar`.

## Open decisions to confirm during implementation

- **Grade scale**: spec requires a "Grade" per student but does not define boundaries. Plan:
  ship a sensible default (A ≥ 80, B ≥ 70, C ≥ 60, D ≥ 50, F < 50, of subject max) as a
  configurable constant, revisit if you want per-school custom scales.
- **Pass mark**: default 50% of a subject's max mark per exam, overridable per
  `exam_subjects` row.

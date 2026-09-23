# Grade AI — Email Architecture

Resend, called only from server-side code via `lib/email/resend-client.ts`
(`RESEND_API_KEY` server-only). MCP shows the Resend account connected but with **no
verified sending domain yet** — see "Manual action needed" below.

## Emails

1. **Welcome email** — sent right after registration (profile created), once. Professional,
   branded, confirms the account was created.
2. **Report ready email** — sent automatically once an exam finishes analysis (end of the
   Excel flow's "Analyze" step). Contains: school, class, examination, average, pass rate,
   failed students count, and a link to the full report. Deliberately **excludes**
   individual student marks/PII beyond what's listed in the spec.
3. **Email Report Again** — a button on the report page that re-sends the same report-ready
   email on demand.

Every send (success or failure) is written to `email_logs` (`type`, `recipient`, `status`,
Resend message id or error) — this feeds the Reports page action and the super admin
"emails sent" stat, and lets a failed send be diagnosed/retried.

## Templates

Simple, branded HTML templates (React Email components or static HTML strings) under
`lib/email/templates/`, one per email type, parameterized — not hand-built strings scattered
through route handlers.

## Manual action needed before Phase 7 works end-to-end

Resend has no verified domain on this account yet. Before automatic emails can actually be
delivered (rather than just attempted), you'll need to either:
- add and verify a sending domain you own in Resend, or
- confirm using Resend's default test sender is acceptable for now.

This will be raised again at the start of Phase 7 rather than blocking earlier phases.

## Supabase Auth SMTP (configured during Phase 2)

Supabase's default email sender has a very low rate limit, which blocked sign-up/reset
testing during Phase 2. Fix: a sending-only Resend API key (`grade-ai-supabase-smtp`) was
created and configured as Supabase Auth's custom SMTP provider (Dashboard → Authentication →
Emails → SMTP Settings), using Resend's shared `onboarding@resend.dev` sender since no domain
is verified yet. This only affects Supabase Auth's own emails (confirmation, password reset)
— it is separate from the app's own transactional emails (welcome, report-ready), which
Phase 7 sends directly via the Resend API using `RESEND_API_KEY`. Once a real domain is
verified in Resend, update the SMTP sender email to match and reuse the same domain for the
app's own emails.

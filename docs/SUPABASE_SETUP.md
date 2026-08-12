# Supabase local connection setup

TraceTutor does not need Supabase for Demo Mode. The complete fictional student and tutor demo stays local and can be entered from `/demo` before or after a project is connected.

## Public configuration only

Copy `.env.example` to an ignored `.env.local` and replace only these public values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
TRACETUTOR_EMAIL_LINK_AUTH_ENABLED=false
TRACETUTOR_EMAIL_CONFIRMATION_REQUIRED=true
```

Use the Project URL and publishable key shown in the Supabase **Connect** dialog. Never copy a secret/service-role key into TraceTutor, a `NEXT_PUBLIC_*` variable, chat, logs, screenshots, or Git.

## Project configuration

1. In Supabase, create or select a project, then open **Connect** and copy the Project URL and publishable key into the ignored `.env.local`.
2. Open **Authentication → URL Configuration**. Set Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/confirm` as a redirect URL.
3. Open **Authentication → Email Templates**. For Confirm signup use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`; for Magic Link use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink`.
4. Apply all five SQL files in `supabase/migrations/` in filename order with the Supabase CLI migration workflow or the project SQL editor. Do not skip the security migration.
5. Run `npm run test:rls`, then use a local Supabase CLI stack to run `supabase test db` against `supabase/tests/rls.test.sql` before connecting real users.

The hosted trial email sender is suitable only for initial development and is rate-limited. Keep email confirmation and magic-link sign-in enabled only when a dedicated transactional SMTP provider is configured. A password-only public beta may temporarily disable Supabase **Confirm email** and set `TRACETUTOR_EMAIL_CONFIRMATION_REQUIRED=false`; in that mode, the app creates an immediate cookie-authenticated session and hides magic-link controls. Student membership still requires a one-time tutor invitation. Email ownership verification and password recovery are unavailable until SMTP is connected, and the UI must state that limitation honestly.

## Current hosted public beta

- Hosted Supabase project migrations: all five applied in filename order.
- Remote pgTAP isolation check: 22 passed, 0 failed, inside a rolled-back transaction.
- Public Vercel variables: Project URL, publishable key, application URL, and account-mode flags only.
- Browser secrets: none. No service-role key or OpenAI key is configured in Vercel.
- Authentication: password sign-up/sign-in, immediate session, immutable role setup, invite-only student linking.
- Demo Mode: remains independent and available from `/demo`.
- Deferred hardening: transactional SMTP, verified email ownership, password recovery, backups, monitoring, and a branded custom domain.

## Connected E2E

The normal Playwright suite always verifies the local demo and skips the credential-gated lifecycle. Against an explicitly configured local Supabase stack with Mailpit/Inbucket:

```bash
SUPABASE_E2E=1 npm run test:e2e
```

Set `SUPABASE_E2E_MAILPIT_URL` only if the local inbox is not at `http://127.0.0.1:54324`. Do not run the lifecycle test against a project containing real users; it creates disposable test accounts and workspace rows.

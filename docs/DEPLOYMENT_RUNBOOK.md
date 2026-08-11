# TraceTutor Preview Deployment Runbook

## Deployment boundary

TraceTutor Phase 9 uses a Vercel **Preview** deployment only. The Preview environment is the staging environment for this phase. Do not run `vercel --prod`, promote a deployment, attach a production/custom domain, create a paid custom environment, or purchase any plan or add-on.

The initial preview intentionally runs in Demo Mode:

- no Supabase project is connected;
- no OpenAI key is uploaded;
- live AI remains disabled;
- all student and tutor demo data stays inside each browser profile;
- no remote database is read, migrated, reset, or deleted.

Vercel documents that `vercel deploy` creates a Preview deployment unless the production flag is supplied. TraceTutor uses the more explicit `vercel deploy --target=preview --logs` form. See [Vercel Preview environments](https://vercel.com/docs/deployments/environments) and [deploying from the CLI](https://vercel.com/docs/projects/deploy-from-cli).

Important empty-project caveat: during the Phase 8 dry run, Vercel automatically classified the empty project's first CLI upload as its initial Production deployment despite the explicit Preview target. No manual promotion occurred. To keep a strict Preview-only history, create or import the Vercel project with its Next.js framework configured before the first source upload, then inspect the target immediately after deployment. If Vercel still assigns the first upload to Production, stop sharing it, do not attach an alias or domain, do not delete remote data, and create a separately inspected Preview.

## Required preflight

Run from the repository root on a clean commit:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:e2e
E2E_PRODUCTION=1 npm run test:e2e
npm run build
npm audit --audit-level=low
npm run test:rls
npm run scan:secrets
git status --short
```

If Supabase public variables are present, also apply all migrations to the selected non-production project, run the pgTAP isolation suite, and run the connected account lifecycle E2E before deploying. Never substitute a production database for this check.

## Environment inventory

No project variable is required for the Demo Mode preview.

| Variable                               | Scope                     | Current preview | Rule                                                                                |
| -------------------------------------- | ------------------------- | --------------- | ----------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Browser/public            | Omitted         | Add only for an explicitly selected non-production Supabase project.                |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser/public            | Omitted         | Publishable key only; never a secret/service-role key.                              |
| `NEXT_PUBLIC_APP_URL`                  | Browser/public            | Omitted         | Required if authenticated callbacks are enabled; set to the exact preview origin.   |
| `OPENAI_API_KEY`                       | Server-only secret        | Omitted         | Add as a Vercel sensitive Preview variable only after separately approving live AI. |
| `TRACETUTOR_LIVE_AI_ENABLED`           | Server-only flag          | Omitted/false   | A key alone must not enable model calls.                                            |
| `TRACETUTOR_OPENAI_MODEL`              | Server-only configuration | Omitted         | Optional; the checked server default applies.                                       |

Environment variables are added only to the Vercel **Preview** environment through the secure dashboard or sensitive-variable CLI prompt. Never put secret values in a command line, URL, source file, screenshot, log, or chat. Vercel’s environment-variable guidance is at [Environment variables](https://vercel.com/docs/environment-variables).

## Create the preview

1. Confirm the Git tree is clean and the intended commit is checked out.
2. Run `vercel whoami` to verify the selected account.
3. Run `vercel link` only if the directory is not already linked. Deliberately select the free/default scope and project; do not accept an upgrade or add-on.
4. Audit the Preview variable names with `vercel env ls preview`. Do not download or print values.
5. Confirm `vercel project inspect` reports the expected project, the checked `vercel.json` forces the `nextjs` framework even if an empty project began with Vercel's `Other` preset, and `.vercelignore` excludes local dependencies, generated output, environment files, and test artifacts.
6. Run `vercel deploy --target=preview --logs` from the repository root.
7. Run `vercel inspect <url>` and require both `target: preview` and `status: Ready` before smoke testing.
8. Record the immutable Preview URL and deployment ID. Do not alias it to a production domain and do not promote it.

Local builds write to `.next.nosync` to avoid macOS file-provider conflict artifacts in Documents. Vercel sets `VERCEL=1`, which intentionally restores the platform-standard `.next` output for the remote build; neither generated directory is uploaded as source.

## Post-deployment verification

Verify the actual Preview URL, not a local server:

- `/` — landing page, independent-product disclaimer, and both demo links;
- `/demo/student` → `/student/today` — visible Demo Mode badge;
- one student mission — start, submit at least one item, refresh, and resume;
- `/demo/tutor` → `/tutor/dashboard` — intervention queue;
- `/tutor/review/case-scope-expansion` — rule trace, pending AI fixture, and tutor controls;
- `/auth/sign-in` — honest Demo Mode fallback when Supabase is disabled;
- auth callback and protected account behavior — connected lifecycle only when non-production Supabase is enabled;
- desktop and 375 px mobile layouts;
- browser console and failed network requests;
- `vercel logs --deployment <deployment-id> --level error` for server errors.

Because Demo Mode stores state in browser storage, use a fresh browser profile when a clean seed is required. Do not describe that state as multi-device or remote synchronization. When a Preview is protected by Vercel Authentication, verify it through a signed-in browser and `vercel curl`. When an owner explicitly authorizes public demo access, disable only Vercel Authentication, keep source/build-log protection enabled, and verify the exact URL with an ordinary unauthenticated HTTP client.

## Phase 8 deployment record

- Vercel scope/project: `1-8746/project-qiel2`
- Verified deployment ID: `dpl_4BwVEwdZdz54h111uwdL8Xdv3kez`
- Verified target/status: `preview` / `Ready`
- Verified URL: `https://project-qiel2-q374ocqnt-1-8746.vercel.app`
- Application variables: none
- Access: public after explicit owner authorization; Vercel Authentication disabled project-wide
- Supabase/OpenAI: disabled; no application credential uploaded

The empty project's first upload was automatically marked Production by Vercel even though `--target=preview` was supplied. It was never manually promoted and was left unmodified to honor the no-delete/no-reset rule. Two early uploads returned 404 while the empty project retained its `Other` framework preset. The checked `vercel.json` corrected the preset before the verified Preview above.

## Phase 9 deployment record

- Vercel scope/project: `1-8746/project-qiel2`
- Verified deployment ID: `dpl_CsgqnBSWEBwHTUN5G9aZrCAGYswB`
- Verified target/status: `preview` / `Ready`
- Verified URL: `https://project-qiel2-4er1c3j4k-1-8746.vercel.app`
- Application variables: none
- Access: public after explicit owner authorization; Vercel Authentication disabled project-wide
- Supabase/OpenAI: disabled; no application credential uploaded
- HTTP smoke: 12 of 12 routes returned 200 through authenticated `vercel curl`
- Browser QA: student correction/resume, 90-minute study plan/resume, progress, tutor adjudication, tutor recommendation acceptance, and 390/768/1440 px layouts passed with zero console warnings/errors
- Public-access smoke: landing, student Today, and tutor dashboard returned 200 without Vercel authentication, cookies, or an automation bypass
- Production changed: no

## Phase 9 release rule

Deploy only after the complete formatter/lint/type/unit/RLS/E2E/build/audit/secret preflight passes and the local checkpoint tag `before-personalized-learning-modes` remains resolvable. The Phase 9 preview must expose zero application variables unless a separately selected non-production Supabase project is connected. Smoke Home, Study, Reviews, Progress, Settings, a 30-minute pause/resume, a 90-minute block plan, tutor engagement/recommendation, and 390/768/1440 px layouts before recording the new immutable preview URL.

## Release decision

The preview is ready to share only when all available checks pass and every unavailable connected check is listed as a limitation. Phase 9 never promotes the preview to Production.

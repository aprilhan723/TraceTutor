# TraceTutor Build State

## Current phase

**Founding tutor pilot plus tutor-first entry diagnostic: the public account beta, complete local demo, and Phase 9 learning behavior are preserved while newly invited students now complete a required Reading baseline before receiving their first recommendation.**

## Public account beta release state

- The existing free Supabase project is connected with all five additive migrations applied in filename order.
- The hosted 22-assertion pgTAP cross-user isolation suite passes with 0 failures; its fixture transaction is rolled back.
- Supabase Confirm Email is temporarily disabled so arbitrary users can start a password session without relying on the development-only hosted mail sender.
- Magic-link UI and requests are disabled. Email verification and password recovery remain unavailable until dedicated transactional SMTP is connected, and the sign-up page states this limitation.
- The account-mode landing page sends tutors to registration/workspace setup and keeps students on the one-time tutor-invitation path.
- The Vercel Production and Preview environments contain only the public Supabase URL/publishable key, public application URL, and server-only feature flags. No service-role key or OpenAI key is uploaded; live AI remains off.
- The complete browser-local `/demo` student and tutor experience remains a safe fallback and sales demo.

## Implemented

- Tutor-first account boundary: uninvited signup is tutor-only, while the one-time invite path locks the new account to student and removes client-controlled role selection
- Newly invited students redirect directly to a required six-item Reading entry diagnostic with target test date and confidence on every response
- Original diagnostic coverage across Complete the Words, Read in Daily Life, and Academic Reading with answer keys omitted from student DTOs
- Deterministic first recommendation from task misses, high-confidence wrong signals, and rule metadata; no official score estimate
- Server-validated, idempotent diagnostic RPC with private answer keys, RLS-linked tutor visibility, audit logging, and automatic conservative study-plan creation
- Existing verified learners are grandfathered through an explicitly labeled existing-plan baseline without fabricating diagnostic attempts
- Tutor dashboard status for waiting/completed diagnostics and shared first-focus evidence

- Dedicated Founding Tutor Pilot page with an explicit free-beta boundary, $49/month pricing hypothesis, 12-active-student assumption, fit criteria, and demo-first conversion
- Landing-page pilot positioning and calls to action without adding payment, analytics, advertising, or lead-storage dependencies
- Validated public metadata origin plus generated sitemap and robots routes that exclude private application paths from discovery
- Updated privacy page separating browser-local Demo Mode from the limited Supabase account beta and stating recovery/deletion limitations
- Public-source README, evaluation-only rights boundary, security policy, contribution boundary, privacy-safe issue forms, and GitHub Actions quality gates
- Official Next.js App Router foundation with strict TypeScript, Tailwind CSS, ESLint, `src/`, and npm configuration
- Premium responsive landing page with all required positioning, method, coverage, trust, and CTA sections
- Demo role selection
- Student shell and all three required student routes
- Tutor shell and all three required tutor routes
- Desktop sidebar, mobile bottom navigation, Demo Mode badge, and demo-only role switching
- Reusable Button, Card, Badge, Progress, EmptyState, PageHeader, AppShell, and SectionHeading components
- Typed domain entities, repository contract, local demo adapter, service layer, one fictional tutor, and one fictional student
- Loading, error, and not-found states
- Unit and E2E smoke test configuration
- Local-only configuration with no secrets or external services
- First-entry student onboarding with locally persisted test date, confidence, daily study time, reminder time, and main struggle
- Personalized 14-day Correction Sprint with deterministic mission selection, D2/D7 review priority, Correction Streak, Recovery Pass, and five-, ten-, or fifteen-minute mission variants
- Full practice route with timer, autosave, refresh-safe resume, keyboard-accessible selection, staged answer/confidence/evidence submission, and concise Secure/Unstable/Diagnose feedback
- Original content library with 12 Complete the Words items, 6 Daily Life questions across 3 stimuli, 6 Academic questions across 2 passages, and 4 transfer checks
- Versioned local browser persistence for onboarding, drafts, attempts, confidence, evidence, reviews, patterns, mission history, and completion
- Confirmed Reset demo data control in the shared demo shell
- Dynamic Mistake Map and Progress dashboards with status chips, mission history, task accuracy, evidence accuracy, and confidence calibration
- Deterministic clock abstraction and seeded review history for stable tests
- Versioned five-axis Mistake Intelligence taxonomy with 8 skills, 6 process stages, 16 error causes, 12 distractor relations, and 8 behavioral contexts
- Pure rule-first diagnosis with observable facts, bounded likely hypotheses, plain-language evidence, probe recommendation, intervention priority, tutor-review routing, and explicit hidden-state limits
- Six original structured diagnostic probes covering modality/quantifier, source versus outside knowledge, actor, date/deadline, example/main claim, and negative constraints
- Six-layer Complete the Words analysis that separates lemma, inflection/tense, derivation/part of speech, spelling/edit distance, local grammar, and wider context
- Reviewed 12-item transfer bank with three distinct surfaces per reasoning family and linked task/error metadata
- Immediate, D2, and D7 retention scheduling with distinct-item safeguards and deterministic dates
- Pattern state transitions for New, Working, Improving, Resolved, Unstable, and Recurring, with three-surface resolution requirements
- VECR-7 calculation that includes only diagnoses with an eligible Day 7 opportunity
- In-practice observation, probe, likely diagnosis, trap explanation, transfer, and correction-schedule experience
- Mistake Map intelligence with recent evidence, cadence states, recurrence, secure returns, and tutor-review visibility
- Non-destructive browser-storage migration from the Phase 2 v2 aggregate to the Phase 3 v3 aggregate
- Versioned local tutor workspace aggregate that preserves the Phase 3 student study contract
- Believable ten-day demo history for one student, including adherence, diagnoses, review outcomes, interventions, feedback, calibration, and task coverage
- Action-first tutor dashboard with Today's Intervention Queue, five operational metrics, recent corrected errors, and a compact student trend
- Transparent priority ranking from high-confidence wrong answers, recurrence, failed D7 reviews, diagnosis ambiguity, test-date proximity, and unresolved student questions, with every applied factor explained
- Complete diagnosis review view with stimulus, answer/evidence comparison, confidence, time, changes, observations, probe, hypotheses, transfer and retention history
- Audited tutor actions for diagnosis approval/change, secondary causes, transfer assignment, follow-up, ambiguity, lesson-brief inclusion, and concise feedback
- Immutable separation between the original machine suggestion and tutor adjudication
- Searchable/filterable student roster and detail route with current patterns, adherence, coverage, calibration, evidence accuracy, review calendar, interventions, private notes, and weekly-summary preview
- Original content library with task/skill filters, distractor labels, evidence spans, lifecycle status, safe authoring validation, and immutable version creation for published edits
- Verified-data next-lesson brief with one to three priorities, cited evidence, 10–15 minute plan, two linked prompts, mastered topics to skip, unresolved questions, editable notes, and print styling
- Student-facing weekly report with missions, verified corrections, pattern movement, calibration change, next focus, and no score estimate
- Shared local persistence so tutor decisions are reflected in the student weekly report after navigation or refresh
- Unit coverage for queue ranking, adjudication audit trails, content validation/versioning, lesson-brief selection, weekly calculations, and tutor persistence/reset
- E2E tutor journey from queue through diagnosis change/approval, transfer assignment, lesson-brief inclusion, and student weekly-report consistency
- Ethical 14-day roadmap with target-date countdown, transparent streak reasons, one Recovery Pass per seven-day period, two-minute Light Day, and four meaningful milestone moments
- Original “Half-Truth Hydra” weekly mixed challenge derived deterministically from frequent reviewed distractor relations and error causes, with per-item selection explanations and a hard safeguard against Boss-only pattern resolution
- Version 5 student study aggregate with non-destructive v2/v3/v4 migration, personalized plans/sessions/daily progress, parked missions, Recovery Pass ledger, milestone acknowledgements, and offline event queue
- Valid manifest, original SVG/PNG install icons, theme metadata, service-worker app shell/visited-mission caching, offline fallback, and local reconnect reconciliation
- Skippable/replayable product tour and dedicated Trust, Privacy, Content Standards, and Method pages
- Consistent SEO/social metadata with original 1200×630 TraceTutor preview artwork
- Student and tutor segment loading/error states and shared in-product independent-practice disclaimers
- Deterministic demo-mode clock control for immediate D2 and D7 review demonstration
- Axe-core Playwright audit coverage for public, student, roadmap, and tutor surfaces
- Opt-in Supabase runtime selected only when both public environment variables are valid; otherwise TraceTutor remains in Demo Mode
- Explicit demo-entry cookie routes that keep the complete fictional student and tutor sales demo available even when account mode is configured
- Official `@supabase/ssr` browser/server clients, Next.js Proxy session refresh, async cookie handling, and server-side `getClaims()` authentication
- Email/password registration, existing-account magic-link sign-in, confirmation/PKCE callback handling, sign out, expired-link recovery, and onboarding continuation
- Database-owned immutable tutor/student role selection with no client-metadata authorization and no post-creation self-escalation
- Tutor organization/class creation, cryptographically random one-time student invitation, invite-only student linking, and protected role-specific application routes
- Authenticated tutor workspace for content copy, linked-student visibility, assignment creation, and recent response review
- Authenticated student workspace for onboarding, assigned work, evidence/confidence response submission, resume-safe duplicate submission handling, and honest progress surfaces
- Storage-agnostic repository factory with a Supabase `LearningRepository` read adapter and narrow validated relational commands for writes
- Six versioned SQL migrations covering the prior 42 RLS-protected public tables plus two entry-diagnostic tables, security-definer commands, taxonomy seed data, personalized study records, indexes, constraints, immutable publication history, soft retirement, audit records, and idempotency records
- Separate machine hypotheses and immutable tutor adjudications for future evaluation
- Column-level protection for correct responses, distractor labels, designated evidence, tutor-only notes, invite hashes, and audit data
- Static RLS coverage/secret verification scripts, a pgTAP cross-user policy test, and a gated connected Supabase E2E workflow
- Optional retry-safe copy of original demo content into a tutor workspace without copying fictional students, attempts, or history
- Authenticated responses marked `private, no-store`; the service worker does not cache authenticated pages or API responses
- Public-only `.env.example`, local Supabase/email template configuration, and a credential-safe setup guide
- Official OpenAI Node SDK 7.4.0 in a `server-only` provider using the Responses API, `responses.parse`, strict Zod Structured Outputs, `store: false`, and a bounded output budget
- Live AI feature flag disabled by default; a key alone never triggers a request, and Demo Mode requires no key
- Minimum de-identified AI input contract covering task/skill metadata, option relation, short evidence excerpts, confidence/timing buckets, structured probe data, aggregate prior pattern, and rule candidates without names, email, roster, or unrelated history
- Strict AI output contract for primary process/cause, confidence, up to two secondary causes, distractor relation, brief evidence, alternatives, next probe/remediation/abstention, tutor-review reasons, and uncertainty-aware student explanation
- Deterministic eligibility rule that calls a model only for multiple plausible rule hypotheses or short-explanation classification
- Typed fallback for disabled/missing API, unneeded model work, timeouts, malformed output, rate limits, open circuit, and provider failure
- Per-user and per-organization in-memory limits, eight-second timeout, one bounded retry, three-failure circuit breaker, privacy-preserving safety identifier, and idempotent request handling
- Redacted operational events and versioned token/cost accounting with no prompt body, key, or hidden reasoning in logs
- Tutor-only AI suggestion card that always preserves the original rule trace and separate tutor adjudication, with explicit model/prompt/schema/usage audit data
- Student weekly-report explanation released only when the model cause matches a completed tutor adjudication
- Versioned six-case de-identified mocked evaluation set covering schema validity, tutor-gold agreement, contradictions, calibration buckets, abstention/review, prompt injection, and fallback behavior
- Append-only `ai_diagnosis_suggestions` migration with tutor-only RLS, direct client mutation revocation, an idempotent scope-checking record function, and no raw prompt or identity storage
- Static RLS verification expanded across all ordered migrations and 42 exposed tables; pgTAP adds tutor-only AI audit and personalized-study isolation assertions
- Dedicated AI evaluation documentation and `test:ai` script; no paid live evaluation was run
- Checked Vercel project configuration with an explicit Next.js framework preset and Node.js 24 runtime pin
- External-base-URL Playwright support for protected or public Preview smoke runs without changing the local E2E workflow
- Preview deployment and non-destructive rollback runbooks with public/server environment scoping, preflight, smoke, and incident guidance
- Vercel Preview deployment in visibly labeled Demo Mode with no Supabase or OpenAI application variable uploaded
- Actual-preview student QA through all six mission items and actual-preview tutor QA through an audited diagnosis approval
- Actual-preview HTTP smoke coverage for landing, both demo entries, sign-in, student Today/practice, tutor dashboard, and tutor diagnosis review
- Actual-preview 375 px rendering verification for landing, student Today, and tutor dashboard with no horizontal overflow

## Phase 9 personalized learning system

- Four-step learner onboarding captures a self-reported 1.0–6.0 practice level, optional 1.0–6.0 target, optional future test date, editable Daily Rhythm or Deep Focus preference, 10–120 minute default, 3–7 study days, optional local time, IANA timezone, and Reading priority.
- The Today Mission is now the approximately ten-minute Daily Core. Due D2/D7 work stays first; high-confidence mistakes, unresolved patterns, learner priority, balanced coverage, and fresh content follow deterministically.
- Daily Core completion is earned only when all required Core entry IDs have submitted attempts. It marks one learner-local calendar day eligible exactly once. Login and idle time never earn streak credit.
- The high-visibility Home surface shows current/longest Correction Streak, active minutes today, weekly goal, target-date countdown, seven-day consistency, due work, current target, recent verified corrections, a context-aware primary action, and 15/30/60/90/120/custom Study More entry points.
- The original SVG Proof Sprout gives the Correction Streak a restrained visual companion: seed, sprout, leafing, seven-day bud, D7 bloom, D2 evidence vein, resolved-pattern sparks, and Recovery dew are derived only from already-verified learning state. The Home card and compact header include equivalent text and screen-reader labels, and opening the app never grows the character.
- The new Study workspace builds Quick, Focused, Deep, Intensive, Full Block, or custom 10–120 minute sessions across Adaptive Mix, Complete the Words, Daily Life, Academic, Mistake Review, Due Reviews, and Timed Mixed topics.
- The deterministic planner protects Daily Core first, avoids ordinary unseen repetition for seven days, prioritizes explicit review/retention work, adds 5–10 minute breaks to long plans, and returns an honest shorter plan when reviewed content is insufficient.
- Study sessions persist planned/available time, blocks, progress, pause/resume state, supported answer metrics, and end-after-block choices. Completed work survives early exit or refresh.
- Active time uses a 15-second batched heartbeat and counts only an active, visible, unpaused session with interaction in the previous 90 seconds.
- Progress now separates consistency, active time, task accuracy/coverage, evidence, confidence calibration, high-confidence wrong rate, corrections, immediate/D2/D7 retention, VECR-7, session history, and test target. Unsupported trends display “Not enough data” instead of fabricated values.
- Tutor engagement shows learner-controlled plan summaries, weekly active time, Core rate, streak, overdue reviews, recent session pattern, content sufficiency, and advisory weekly/priority/session recommendations that learners explicitly accept or decline.
- Demo study state is version 5 under `tracetutor.demo.study.v5`; v2/v3/v4 migration preserves attempts, drafts, reviews, retention, patterns, mission history, and tutor state while assigning zero unverified historical active time and showing the one-time plan upgrade.
- Additive migration `202608110002_phase9_personalized_learning.sql` adds six RLS-protected tables, validated IANA timezones, zero-activity new-session enforcement, idempotent activity events, server daily-progress/streak functions, learner-controlled recommendations, existing-profile plan backfill, and no destructive statement.
- Signed-in Supabase accounts receive personalized-plan onboarding/settings, a real persisted streak header, account progress summaries, and linked-tutor-only engagement visibility. Demo Mode remains fully independent when public Supabase variables are absent.
- Navigation is now Home, Study, Reviews, Mistake Map, Progress, and Settings with the compact streak visible in desktop and mobile application chrome.

## Deferred by design

- AI-generated practice content or autonomous diagnosis
- Paid live model evaluation without separate approval
- PDF generation (browser print is implemented)
- Payments, remote notifications, and custom-domain purchase
- Official score estimates or predictions
- Push notifications, public rankings, XP, fake scarcity, or attendance-only rewards
- Background sync, true server reconciliation, and multi-device guarantees

## Known Phase 9 limitations

- The entry-diagnostic migration is now applied to the connected hosted Supabase project. Dedicated transactional email, verified email ownership, and password recovery remain deferred.

- The selected Vercel project began as an empty project. Vercel automatically assigned the first CLI upload to its Production target even though the command explicitly used `--target=preview`. TraceTutor did not request or perform a Production promotion, attach a domain, or upload application secrets. That immutable first record was left untouched because this phase forbids deletion/reset of remote data. The verified staging artifact is the later deployment whose target is explicitly `preview`.
- After explicit owner authorization, project-level Vercel Authentication was disabled so the Demo Mode Preview can be opened without a Vercel account. Unauthenticated HTTP checks for the landing, student Today, and tutor dashboard routes return 200. Source/build-log protection remains unchanged; the Preview contains no application environment variables or connected learner database.
- Earlier immutable Phase 8/9 Preview URLs remain Demo Mode artifacts with zero application variables. The current account release uses a separately configured hosted Supabase runtime while preserving `/demo`.
- Browser-local demo progress is isolated to one browser profile and is not multi-device synchronization. Preview redeployments do not migrate that local data.
- The first two upload attempts used the empty project's `Other` framework preset and returned 404. The checked `vercel.json` now forces `nextjs`; the verified Preview builds and serves all expected routes.

- Live AI is intentionally off unless `TRACETUTOR_LIVE_AI_ENABLED=true`; this phase made no paid API request even though a secure local server key is available.
- Rate limits, circuit state, idempotency cache, and usage totals are process-local. A multi-instance deployment needs a durable shared store before live AI is enabled.
- The authenticated Supabase diagnosis-review schema and RLS audit tables are hosted. Live AI remains off; tutor adjudication and deterministic rule observations stay authoritative.
- Production builds refuse live AI calls from anonymous Demo Mode; live production assistance requires a cookie-authenticated tutor and linked organization.
- Cost estimates are versioned for the documented GPT-5.6 model family; an unknown model reports cost as unavailable instead of inventing a price.
- The six mocked fixtures are a contract/evaluation baseline, not evidence of production learning efficacy or model quality on real student data.

- All five migrations are applied to the selected hosted project. The corrected 22-assertion pgTAP suite passes remotely and rolls back its synthetic isolation fixtures.
- Authenticated multi-device personalized session authoring remains limited to assigned/published account content. The complete adaptive session planner and offline-safe resume are available in the local Demo Mode until connected backend reconciliation is explicitly designed and verified.
- The reviewed demo pool is intentionally finite. Long plans may end early with a visible sufficiency warning rather than repeat ordinary unseen items or manufacture volume.

- Browser storage and service-worker caches are device- and browser-profile-local; clearing site data removes the demo.
- “Reconciled” offline events only mean the local queue has been processed after reconnect. No remote server receives them in this phase.
- Install prompts and offline capabilities depend on browser PWA support and a secure context; localhost is treated as secure for development.
- There is no push notification service, account recovery, conflict resolution, or multi-device sync.
- The Weekly Boss uses reviewed deterministic rule data rather than generated content or external AI.
- Lesson brief export remains browser print; no PDF file generator is included.
- The connected registration/invitation/assignment E2E remains gated to an isolated local Supabase stack because it creates disposable accounts. It is intentionally not run against the hosted project containing real users.
- Authenticated account pages intentionally use `private, no-store`; browser-local offline mission reconciliation remains a Demo Mode capability until a server conflict protocol is designed and verified.
- Supabase-generated TypeScript types should replace the checked relational interface after the first migration is applied to the selected project.
- Transactional SMTP, a branded custom domain, backups, monitoring, and payments remain unconfigured. Live AI remains intentionally disabled.

## Exact next backend phase

**Add dedicated transactional SMTP and password recovery, regenerate database types from the hosted schema, then add durable authenticated offline reconciliation, distributed AI limits/usage accounting, backups, and monitoring. A branded custom domain, payments, and live AI remain separate opt-in work.**

## Tutor-first entry diagnostic verification — 2026-08-12

- Formatting, ESLint, Next.js route generation, and strict TypeScript passed with zero errors.
- Vitest passed 33 files and 117 unit/integration tests, including the six-item Reading diagnostic and deterministic recommendation rules.
- Playwright passed 32 desktop/mobile browser journeys with 6 expected environment-gated skips; all 6 representative axe audits reported zero serious or critical violations.
- Static RLS verification passed all 44 exposed tables; the additive diagnostic migration and 6 pgTAP assertions are present but intentionally not applied to the hosted project in this local change.
- Secret scan passed 252 repository files, and the dependency audit reported zero vulnerabilities.
- Next.js 16.3.0 production build compiled, typechecked, and generated all 37 page units, including `/student/diagnostic`.
- Browser inspection confirmed the 375 px student entry has no horizontal overflow or console warnings/errors. Demo Mode remains independent and redirects its unsupported diagnostic URL back to the preserved local onboarding flow.

## Phase 9 verification

- Formatting, ESLint, Next.js route generation, and strict TypeScript: passed with zero errors
- Vitest: 31 files and 111 unit/integration tests passed
- Playwright development: 30 passed and 4 expected skips out of 34
- Playwright production: 31 passed and 3 expected skips out of 34
- Accessibility: 12 representative development/production axe audits passed with zero serious or critical violations
- Production build: passed with all 33 generation units completed
- Dependency audit: 615 packages audited with zero vulnerabilities at every severity
- Secret scan: passed across 228 repository files with zero findings; generated browser/server build files also had zero credential-pattern findings
- Static RLS verification: all 42 exposed tables passed; the 22 connected pgTAP assertions remain gated because Supabase is not configured
- Migration inventory: all five ordered SQL migrations are present; remote migration status is unavailable because no Supabase project is connected
- Preview route smoke: 12 of 12 authenticated HTTP checks returned 200; Vercel reported no runtime error logs
- Preview browser QA: personalized onboarding, one correction plus refresh/resume, a 90-minute block plan plus pause/resume, progress, tutor adjudication/transfer/lesson actions, and learner-controlled recommendation acceptance passed; 390/768/1440 px surfaces had zero horizontal overflow and browser warnings/errors were zero
- Verified Preview: `https://project-qiel2-4er1c3j4k-1-8746.vercel.app` (`dpl_CsgqnBSWEBwHTUN5G9aZrCAGYswB`, target `preview`, status `Ready`)
- Proof Sprout refresh Preview: `https://project-qiel2-64h015xfs-1-8746.vercel.app` (`dpl_HQRBiJ3xEcTC2assGscNqiMWWpqb`, target `preview`, status `Ready`); unauthenticated landing, student Today, and tutor dashboard checks returned 200, and 1280/390 px browser QA found no horizontal overflow
- Production changed: no; no promotion, Production deployment command, domain, paid environment, application variable, or remote-data mutation was performed

Local builds use `.next.nosync` because this checkout is under macOS Documents storage, where file-provider conflict copies previously contaminated `.next`. Vercel keeps the conventional `.next` output because `VERCEL=1`; this changes only generated output location, not application behavior or route contracts.

## Public account release verification

- Formatting, ESLint, Next.js route generation, and strict TypeScript: passed with zero errors.
- Vitest: 31 files and 111 unit/integration tests passed.
- Playwright development rerun: 30 passed and 4 expected skips out of 34 after correcting the existing first dynamic-route development warm-up fallback.
- Playwright production: 31 passed and 3 expected skips out of 34, including the offline-safe PWA path.
- Accessibility: 12 desktop/mobile axe audits passed with zero serious or critical violations.
- Production build: Next.js 16.3.0 compiled, typechecked, and generated all 33 page units successfully.
- Dependency audit: zero vulnerabilities at every severity.
- Secret scan: 228 repository files passed; 66 generated browser-static files contained neither the local OpenAI key nor forbidden server variable names.
- Static RLS: all 42 exposed tables passed. Hosted transactional pgTAP: 22 passed and 0 failed.
- Migration inventory/status: all five ordered migrations are present and applied to the selected hosted project.
- Hosted variables: six approved names in Production and Preview; no service-role/OpenAI key; live AI disabled.
- Vercel public Production deployment `dpl_84iKiGyJacLP7kAhbUgBhDcNnvm3` is Ready and aliased to `https://project-qiel2.vercel.app`.
- Actual-domain HTTP smoke: 10/10 landing, account, demo, protected-shell, manifest, and trust requests returned 200 without Vercel Authentication.
- Actual-domain account-mode browser smoke: 2/2 desktop/mobile checks passed for registration UI, anonymous route protection, separate Demo Mode entry, zero console errors, and no horizontal overflow.
- Hosted account creation was not automated against the real project because the connected lifecycle test intentionally creates disposable users; the public form and immediate-session code path are verified without polluting hosted learner data.

## Founding tutor pilot launch verification

- Formatting and ESLint passed with zero errors.
- Next.js route generation and strict TypeScript passed with zero errors.
- Vitest passed 32 files and 114 unit/integration tests, including the validated public-origin helper.
- Static RLS verification passed all 42 exposed tables.
- Secret scan passed 241 repository files.
- Next.js 16.3.0 production build compiled and emitted the landing, pilot, sitemap, and robots artifacts.
- Playwright production passed 33 browser journeys with 5 expected environment-gated skips across desktop and mobile profiles.
- The new pilot path passed its conversion smoke twice and its axe-core accessibility audit twice.
- Browser visual QA at 1440 × 1000 and 390 × 844 found no horizontal overflow; the pricing hypothesis, free-beta boundary, and independent-product notice remained visible and readable.
- Dependency audit passed with zero vulnerabilities.
- Vercel Preview dpl_C38GbF4rjX8nPuvwDhBNi4jNdCBT is Ready at https://project-qiel2-3d3n7oo53-1-8746.vercel.app; the target is explicitly preview, and Production was not changed.
- Actual-Preview browser smoke passed for the pilot, account-mode landing, anonymous protected-route redirect, isolated Demo Mode entry, robots, sitemap, and zero browser warning/error logs.
- GitHub publication remains pending because the connected GitHub account has no repository yet and the available browser is not signed in. No remote repository, billing system, or hosted learner data was created or mutated by the launch deployment.

## Public diagnostic release — 2026-08-13

- GitHub `aprilhan723/TraceTutor` `main` now points to `651cf9dc64e02f912cc89fcb705310bc7d613df8`; the existing untracked `outputs/` directory remains untouched.
- Additive migration `202608120001_phase10_entry_diagnostic.sql` was applied to the existing hosted TOEFL Supabase project without resetting or deleting data.
- Hosted verification confirmed the diagnostic, response, and private answer-key tables, the validated completion function, and both diagnostic policies.
- Vercel Production deployment `dpl_6Y2dULq5YywPqBugwPYrFVqbzz1f` is `Ready` and aliased to `https://project-qiel2.vercel.app`.
- Public HTTP smoke passed for the landing, account sign-up, student diagnostic, and separate Demo Mode routes; no Vercel or ChatGPT login gate is enabled.
- Live browser inspection found zero horizontal overflow and the landing exposes direct account, tutor-workspace, invited-student, and separate-demo paths.
- Production Playwright account smoke passed 2/2 across desktop and Pixel 7: registration, anonymous route protection, separate Demo Mode, console errors, and horizontal overflow.
- Final validation passed formatting, ESLint, strict TypeScript, 117/117 unit/integration tests, 44-table RLS static checks, a 37-route Production build, dependency audit, and a 249-file secret scan.
- Delivered JavaScript scan inspected 9 files and found zero `sb_secret_`, `service_role`, or `OPENAI_API_KEY` matches.
- No service-role key or OpenAI key was added to the browser or Vercel environment; live AI remains disabled.

# TraceTutor Architecture

## Runtime and framework

- Next.js 16.3.0 App Router
- React 19.2
- TypeScript with strict checking and JavaScript disabled
- Tailwind CSS 4
- ESLint 9 with Next.js Core Web Vitals and TypeScript rules
- npm lockfile and package manager declaration
- OpenAI Node SDK 7.4.0, imported only by a `server-only` provider module

The official Webpack opt-in is used for local development and production builds because this managed environment blocks the loopback worker port used by Turbopack’s PostCSS evaluation. No custom Webpack configuration is present.

Next.js currently requires Node.js 20.9 or newer. The installed official Supabase client requires Node.js 22 or newer, so TraceTutor declares Node 22 as its combined minimum and is verified with Node.js 24.14.0.

## Application boundaries

```text
App Router pages and client experience components
    ↓
Runtime mode selector
    ↓
Demo: StudentDemoProvider / TutorDemoProvider → LearningService
Authenticated: Server Components / validated Server Actions
    ↓
LearningRepository interface
    ↓
LocalDemoLearningRepository | SupabaseLearningRepository
    ↓
localStorage | cookie-authenticated Supabase with RLS
    ↘ optional server-only AI disambiguation → tutor review (never direct truth)
```

Route components do not import mock records. The repository factory selects `LocalDemoLearningRepository` whenever public configuration is absent or the request explicitly enters Demo Mode, and selects `SupabaseLearningRepository` only with authenticated Supabase context. Existing demo providers and their storage keys are unchanged. Authenticated relational mutations use narrow server actions and database functions instead of accepting a client-authored aggregate; this preserves the repository read contract while preventing students from writing final outcomes or tutor decisions.

## Supabase SSR and authorization

`@supabase/ssr` creates separate browser and server clients from only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Next.js 16 `src/proxy.ts` refreshes the cookie session with `getClaims()`. Server layouts call `requireAccountRole`, which verifies claims again, loads the authoritative `profiles.role`, and redirects incomplete or wrong-role accounts. Every Server Action and security-definer database function repeats its own role/ownership check; Proxy is never treated as the authorization boundary.

The local demo and authenticated product coexist in one build. `/demo/student` and `/demo/tutor` use full document navigation to set a short-lived HTTP-only demo-mode cookie. Successful sign-in, signup, email confirmation, and sign-out clear that cookie. No Supabase session, account data, or service key is stored in local demo records.

## Relational data model

Five ordered migrations under `supabase/migrations/` create:

- identity and ownership: profiles, organizations, memberships, classes, tutor/student links, and one-time invite hashes;
- immutable content: stimuli/items plus versions, option/evidence rows, taxonomy versions, skills, and version mappings;
- work and observations: assignments, assignment items, attempts, responses, response events, confidence, and evidence selections;
- verification and retention: diagnostic sessions, machine hypotheses, append-only tutor adjudications, transfer links, review schedules/attempts, and learner error states;
- communication and accountability: questions, messages, tutor-only notes, append-only audit logs, and idempotency records.
- optional assistance audit: append-only, tutor-only AI suggestions with input fingerprints, model/prompt/schema versions, policy review, token usage, and estimated cost—never raw prompt bodies or identity;
- personalized study: learner plans, study sessions, daily progress, streak summaries, idempotent activity events, and visible tutor recommendations.

Indexes cover every common ownership, due-date, assignment, review, and policy join. Published content and its children are trigger-protected. Publication validates complete options, exactly one key, and designated evidence. Client column privileges hide correct responses, correct-option flags, distractor tags, explanations, and designated-evidence flags from the student Data API surface.

## RLS design

All 42 exposed tables enable RLS. Private security-definer helpers answer narrowly scoped questions such as organization tutoring, explicit tutor/student linkage, assignment ownership, and item/diagnostic readability. They use empty search paths and indexed relations. Anonymous table access is revoked.

Students can select only their own assignments, attempts, responses, diagnoses, reviews, messages, and assigned content. Tutors can select or mutate only records in an active linked organization/class relationship. Tutor notes never have a student policy. Direct mutations of memberships, links, invitations, attempts, final responses, diagnostics, hypotheses, adjudications, retention state, audit logs, and idempotency rows are revoked from authenticated clients.

The repeatable static verifier checks that every exposed table is RLS-enabled and policy-covered. `supabase/tests/rls.test.sql` adds pgTAP cross-user fixtures for assignment isolation, linked-tutor visibility, tutor-note privacy, role escalation denial, and adjudication denial when a local Supabase runtime is available.

## Server validation and idempotency

Zod schemas validate every form and command identifier, bounded text, dates, response shape, confidence, evidence arrays, timing, and answer-change counts. Database functions then re-check the authenticated role and relational ownership, making URL or hidden-input tampering insufficient. `client_submission_id` makes student responses idempotent. Tutor assignment and adjudication commands use actor/scope/idempotency records; adjudications append revisions and preserve the original machine suggestion.

## Offline conflict policy

The Phase 5 local demo queue remains wholly browser-local and never claims remote sync. Proxy marks only known demo application responses as cache-safe; authenticated pages are deliberately private/no-store, purge a same-URL demo cache entry after an online account navigation, and are never service-worker cached. A connected student submission is accepted once by its client submission ID; a retry returns the original attempt. True authenticated offline assignment snapshots, conflict merging, and multi-device synchronization remain disabled until a backend phase explicitly designs server reconciliation for them.

## Student study aggregate

- `StudentOnboarding` stores the five personalization inputs.
- `StudentStudyState` version 5 is the aggregate for learner plans, study sessions, daily progress, onboarding, attempts, reviews, mission history, diagnosis records, probe responses, retention schedules, mistake patterns, the ethical streak ledger, Recovery Pass uses, celebrated milestones, offline events, and active/parked missions.
- `StudentMission` contains deterministic entry references, drafts, current position, timing, and completion state.
- `PracticeItem` is a discriminated union for Complete the Words, evidence-based reading questions, and transfer checks.
- `StudyAttempt` records the submitted answer, confidence, evidence IDs, elapsed seconds, answer changes, diagnosis link, and transparent Secure/Unstable/Diagnose result.
- `DiagnosisRecord` snapshots all known observations and the current bounded hypothesis, including taxonomy version, probe link, tutor-review flag, and remediation target.
- `RetentionSchedule` links one diagnosis to a unique Immediate, D2, or D7 transfer item and its eventual attempt outcome.
- `StudentPatternRecord` aggregates a cause/process pair without erasing its diagnosis evidence, distinct transfer surfaces, retention cadence state, or recurrence history.
- `MissionMode` distinguishes standard, Light Day, Weekly Boss, and tutor-assigned work. History snapshots the exact qualifying streak reason.
- `Clock` isolates the deterministic demo date from real wall-clock behavior. `LocalDemoClock` persists a demo-only date override so D2 and D7 can be demonstrated without waiting.

The local adapter serializes the aggregate under `tracetutor.demo.study.v5`. Validated v2, v3, and v4 aggregates are migrated in place so onboarding, drafts, attempts, mission progress, review/retention, and diagnosis data survive the upgrade. Unsupported historical active time stays zero. The adapter safely falls back to an original seed state if storage is unavailable or malformed.

## Engagement and offline pipeline

```text
Versioned local study state + deterministic clock
    ↓
Pure roadmap / streak / Light Day / milestone / Weekly Boss selectors
    ↓
LearningService mutation and safeguard checks
    ↓
LocalDemoLearningRepository
    ↓
localStorage + service-worker cached shell/visited mission
```

`engagement-engine.ts` is deterministic and contains no browser APIs. Weekly Boss attempts are explicitly excluded from diagnosis creation, retention scheduling, and pattern mutation. `LearningService` can park the normal mission while a Boss runs and restore it afterward.

The service worker caches only same-origin GET navigation responses and static assets. The practice experience explicitly requests caching for the active, already-downloaded mission. Attempt payloads remain in localStorage; no credentials or secrets are cached. An offline attempt appends an `OfflineAttemptEvent`, which changes from `queued` to `reconciled` when the browser reconnects. In Phase 5 reconciliation is local bookkeeping, not a remote sync claim.

## Tutor workspace aggregate

`TutorWorkspaceState` version 1 is deliberately separate from the Phase 3 student aggregate. It stores diagnosis review cases, immutable machine snapshots, mutable tutor adjudications, append-only audit events, student profiles and ten-day adherence, tutor-only notes, content versions, and lesson-brief notes under `tracetutor.demo.tutor.v1`.

- `TutorDiagnosisCase` joins a frozen attempt snapshot, evidence comparison, observations, probe response, retention history, student question, machine suggestion, tutor adjudication, and audit trail.
- `MachineDiagnosisSnapshot` is never overwritten by tutor actions, preserving future evaluation data.
- `TutorAdjudication` contains the verified primary and secondary causes, review status, transfer assignment, follow-up, ambiguity flag, lesson-brief inclusion, feedback, and review duration.
- `TutorContentVersion` snapshots each authored version. Published edits append a version instead of mutating an item used by earlier attempts.
- `TutorStudentProfile` supports multiple records even though Phase 4 seeds one student.

Reset removes the study, tutor, demo-clock, and legacy study aggregates only after explicit confirmation.

## Tutor operations

```text
Tutor workspace + deterministic clock
    ↓
Pure queue scoring / metrics / reports / brief selectors
    ↓
LearningService command
    ↓
Immutable aggregate update + audit event
    ↓
LearningRepository persistence
```

`tutor-operations.ts` contains deterministic selectors and transformations for queue ranking, dashboard metrics, adjudication, content validation and versioning, student summaries, lesson briefs, and weekly reports. The queue score exposes all applied factors and is described as an instructional sorting aid. `LearningService` supplies the timestamp and actor ID and persists the returned aggregate.

## Mistake Intelligence pipeline

```text
Reviewed item metadata + observable attempt
    ↓
Pure diagnosis rules
    ↓
Known observations + likely hypothesis + optional probe
    ↓
Pure probe refinement (when useful)
    ↓
Distinct Immediate / D2 / D7 transfer schedules
    ↓
Pattern transitions and eligible VECR-7 aggregation
```

The engine is intentionally deterministic and external-service-free. Reviewed option metadata supplies distractor relations and bounded error-cause hints. `diagnoseAttempt` cannot read browser state or mutate records; it only transforms typed input. `refineDiagnosisWithProbe`, Complete the Words analysis, transfer selection, pattern transition, and VECR-7 calculation are also pure. `LearningService` is the orchestration boundary that persists their outputs through `LearningRepository`.

Timing, answer changes, selected evidence, and reported confidence are observations or behavioral context. They do not become causal labels by themselves. Stored supporting text uses probabilistic “likely” language, and high-confidence wrong answers are routed for tutor review rather than treated as certain diagnoses.

## Optional AI diagnosis boundary

```text
Deterministic rule result with multiple candidates
    ↓
Minimal de-identified AiDiagnosisInput (strict Zod validation)
    ↓
Feature flag + tutor auth + per-user/org limit + circuit breaker
    ↓
OpenAI Responses API · strict Structured Outputs · store:false
    ↓
Second schema validation + contradiction/review policy
    ↓
Append-only model/prompt/schema/usage audit
    ↓
Tutor adjudication remains separate and final
```

`src/ai/` contains the storage-independent input/output contract, prompt policy, safety controls, usage ledger, fixture evaluator, and the provider interface. Only `openai-provider.ts`, `server-config.ts`, and `server-service.ts` import `server-only` or read `OPENAI_API_KEY`. Browser code can send only the strict de-identified DTO to the no-store route handler; actor and organization scope are resolved from Demo Mode or verified Supabase cookies, never request fields.

Live AI requests from Demo Mode are permitted only by the development server. A production runtime requires a cookie-authenticated tutor and active organization membership, and the route rejects cross-origin requests. This prevents a public sales demo from becoming an anonymous paid-API relay.

The default model is `gpt-5.6-luna`, chosen from current official guidance for cost-sensitive workloads. The adapter uses `responses.parse` with `zodTextFormat`, a maximum output budget, `store: false`, and a privacy-preserving safety identifier derived from opaque server actor IDs. The orchestration layer retries once, times out after eight seconds, opens a short circuit after repeated failures, and always returns a typed deterministic fallback. It stores no hidden reasoning and logs no prompt body.

The local tutor aggregate may append multiple `AiDiagnosisAuditSnapshot` records per diagnosis. These snapshots preserve provider output, policy review, versions, fingerprint, and usage while leaving `MachineDiagnosisSnapshot` and `TutorAdjudication` untouched. A student-facing explanation is selected only when the latest AI primary cause matches a completed tutor decision.

## Source map

- `src/app/` — routes, layouts, metadata, and framework states
- `src/components/` — shared product and UI components
- `src/domain/` — storage-independent entities, versioned taxonomies, and repository contracts
- `src/data/` — original practice content, reviewed diagnostic metadata, six structured probes, transfer bank, student and tutor seed state, and local repository adapter
- `src/services/` — pure diagnosis, Complete the Words analysis, transfer/retention logic, mission selection, tutor operations, evaluation, analytics, persistence orchestration, and UI data assembly
- `src/ai/` — de-identified contracts, strict schemas, optional provider orchestration, safety/cost controls, and versioned mocked evaluation fixtures
- `src/content/` — typed static marketing content
- `src/test/` — shared unit test setup
- `e2e/` — Playwright student, diagnosis, spaced-review, tutor, offline/PWA, responsive, and accessibility journeys

## Rendering strategy

Pages and layouts remain Server Components by default. Student learning flows and tutor workspaces are Client Components because onboarding, autosave, review actions, filters, editing, and browser persistence require interaction. Manifest, metadata, trust pages, loading states, and policy content remain Server Components. A tiny registration component is the only root-level client runtime added for the service worker. `StudentDemoProvider` and `TutorDemoProvider` keep persistence concerns outside route components. Repository reads and writes remain asynchronous even though the Phase 5 adapter is local, preserving the contract expected by a remote adapter.

## Accessibility

- Semantic landmarks, sections, headings, lists, and navigation labels
- Skip links on public and app surfaces
- Visible keyboard focus states
- Minimum 40–56 px interactive targets
- `aria-current` navigation state
- Native fieldsets, radio groups, labels, and disabled sequencing controls
- `aria-pressed` evidence segments with visible text labels
- Modal focus placement, dialog semantics, and explicit reset confirmation
- Native search, select, textarea, details, and print controls in tutor workflows
- Accessible progressbar values and labels
- Reduced-motion support
- Automated axe-core assertions for zero serious or critical violations on representative public, student, roadmap, and tutor surfaces

## Responsive layout

Marketing layouts are mobile-first and progressively move to two- or three-column grids. The application uses a fixed desktop sidebar at the `lg` breakpoint and a safe-area-aware bottom navigation below it. Practice mode suppresses app navigation to preserve focus and uses a compact header that remains usable at approximately 375 px. Tutor queues collapse to one column on mobile, detail and editor grids progressively expand, and the lesson brief has dedicated print rules that remove application chrome and actions.

## Testing and quality

- Vitest + Testing Library for taxonomy boundaries, diagnosis rules, Complete the Words layers, mission selection, persistence, transfer/retention, queue ranking, adjudication audit history, content validation/versioning, lesson-brief selection, report calculations, strict AI schemas, mocked provider fallbacks, rate/circuit behavior, prompt injection, tutor-gold evaluation, service integration, and components
- Playwright coverage for onboarding and full mission completion, high-confidence wrong diagnosis and transfer, demo-clock D2/D7 review, tutor queue → diagnosis → transfer → lesson brief, offline-safe resume, and representative axe-core accessibility audits in desktop Chromium and Pixel 7 profiles
- ESLint, strict TypeScript, Prettier, and production build checks

## Next backend notes

Phase 9 still uses no service-role key, payments, Production release, or production SMTP; only an isolated Preview is permitted. The next backend phase should verify all five migrations against the selected non-production hosted/local project, regenerate database types, connect durable distributed rate/usage controls, add operational monitoring/backups and authenticated offline reconciliation, and run a separately approved blinded live evaluation before enabling AI for real learners. UI code must continue to use repository/services or validated server commands rather than importing seeds or trusting client-authored ownership.

## Preview deployment boundary

Phase 9 uses Vercel's default Preview environment as staging. TraceTutor never requests or performs a Production promotion, attaches a domain, or enables a paid custom environment. The Preview supplies no application environment variables, so runtime selection stays in the complete browser-local Demo Mode and neither Supabase nor OpenAI is contacted. The deployment runbook records Vercel's exceptional automatic classification of an empty project's first upload as Production and the separately inspected Preview that replaced it for staging QA.

Only the Supabase Project URL and publishable key may ever use `NEXT_PUBLIC_*` names. `OPENAI_API_KEY` and live-AI controls remain server-only behind `server-only` modules; no service-role variable exists in the application contract. Build output and the checked browser-static chunks are scanned for credential patterns before preview creation.

Preview deployment and rollback procedures are operational documentation rather than application runtime dependencies. Preview URLs are treated as immutable artifacts. Rollback creates and verifies a new preview from the previous good commit without deleting a deployment, changing production aliases, or resetting remote state.

Local Next.js output uses the in-project `.next.nosync` directory to prevent macOS file-provider conflict copies from being restored into generated type/build artifacts. This is configured through Next.js `distDir`, remains inside the repository as required by Next.js, and is ignored by Git and ESLint. Vercel sets `VERCEL=1`, so Preview builds continue to use the platform-standard `.next` directory.

## Phase 9 personalized-study architecture

`StudentStudyState` version 5 adds `LearnerStudyPlan`, `StudySession`, `StudyPlanBlock`, `DailyLearnerProgress`, `CorrectionStreakStats`, and `TutorStudyRecommendation` without changing the repository boundary. `LocalDemoLearningRepository` migrates v2/v3/v4 aggregates into the v5 key, preserves verified learning records, assigns zero unsupported historical seconds, and leaves `onboardingCompletedAt` empty for the one-time upgrade.

`mission-engine.ts` owns the Daily Core selection. `session-planner.ts` is a pure deterministic extension planner with duration fitting, topic filtering, deliberate-review exceptions, seven-day unseen-item exclusion, long-session breaks, test-date timed blocks, and content-shortage reporting. `study-session-service.ts` maps plan blocks onto mission entries and performs pure attach, attempt, pause, resume, active-time, end-after-block, and completion transitions. `personalized-learning.ts` owns learner-local dates, weekly activity, consistency, and streak calculations. `study-analytics.ts` derives only metrics supported by stored observations.

`proof-sprout.tsx` is a presentation-only, original inline SVG. Its seed, sprout, leafing, bud, bloom, resolved-pattern sparks, and Recovery dew are derived from existing streak, retention, pattern, and Recovery Pass fields. It introduces no persistence key, repository method, hidden engagement score, raster asset, or external request. The same pure stage/description helpers drive visible labels and screen-reader output; global reduced-motion rules suppress its subtle decorative movement.

Active time is intentionally event-based. A client heartbeat proposes at most 90 seconds per event; the UI currently batches 15 seconds and first checks active session status, document visibility, pause state, and a 90-second interaction threshold. The local service records the same delta into the session and unique learner/local-date record. In Supabase mode, `record_study_activity` accepts idempotent client event IDs, re-checks ownership and active status, and atomically updates server records; direct counter updates are revoked.

The fifth additive migration creates `learner_study_plans`, `study_sessions`, `daily_learner_progress`, `learner_streak_stats`, `study_activity_events`, and `tutor_study_recommendations`. All six enable RLS. Students can read their own rows; linked tutors can read session/daily/streak summaries but not private plan rows or raw activity events; unrelated tutors see none. New client sessions must begin with zero activity, sensitive counters are RPC-owned, IANA timezone names are database-validated, and tutor recommendations require an existing organization link. Existing completed student profiles receive conservative plan defaults only—no historical time, attempts, Core completion, or streak is manufactured.

The Supabase adapter maps the six tables back into the existing aggregate contract. Validated server commands repeat role/ownership checks for plan writes, idempotent activity, tutor recommendations, and learner responses. The local Demo Mode remains the complete offline-safe product and does not depend on Supabase, OpenAI, or a secret.

## Hosted account-mode runtime

The runtime still selects the storage adapter at the existing boundary. Valid public Supabase URL and publishable-key variables activate cookie-based account mode; their absence activates the complete local demo. An explicit demo-entry cookie keeps `/demo` isolated even on the hosted account release.

Password sign-up may return either a pending-confirmation user or an immediate session. The server action handles both: a confirmed session continues directly to immutable role setup, while a confirmation-required project returns the existing email-confirmation state. Server-only flags hide magic-link UI when transactional email is unavailable. These flags are not authorization inputs; profile roles, memberships, invitations, and every data access decision remain database-owned and RLS-enforced.

The hosted project contains all five additive migrations. The 22-assertion pgTAP suite executes as transactional test users and rolls back its fixture data. Only the Supabase Project URL and publishable key are public. No service-role key exists in the client or deployment contract, and live OpenAI requests remain disabled.

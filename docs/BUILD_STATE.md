# TraceTutor Build State

## Current phase

**Phase 5: complete and verified as a local release candidate.**

## Implemented

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
- Version 4 student study aggregate with non-destructive v2/v3 migration, parked missions, Recovery Pass ledger, milestone acknowledgements, and offline event queue
- Valid manifest, original SVG/PNG install icons, theme metadata, service-worker app shell/visited-mission caching, offline fallback, and local reconnect reconciliation
- Skippable/replayable product tour and dedicated Trust, Privacy, Content Standards, and Method pages
- Consistent SEO/social metadata with original 1200×630 TraceTutor preview artwork
- Student and tutor segment loading/error states and shared in-product independent-practice disclaimers
- Deterministic demo-mode clock control for immediate D2 and D7 review demonstration
- Axe-core Playwright audit coverage for public, student, roadmap, and tutor surfaces

## Deferred by design

- Authentication and authorization
- Remote data and Supabase
- External AI diagnosis or generated content
- Real authentication, tutor/student permissions, and remote multi-student synchronization
- PDF generation (browser print is implemented)
- Payments, remote notifications, and deployment
- Official score estimates or predictions
- Push notifications, public rankings, XP, fake scarcity, or attendance-only rewards
- Background sync, true server reconciliation, and multi-device guarantees

## Known Phase 5 limitations

- Browser storage and service-worker caches are device- and browser-profile-local; clearing site data removes the demo.
- “Reconciled” offline events only mean the local queue has been processed after reconnect. No remote server receives them in this phase.
- Install prompts and offline capabilities depend on browser PWA support and a secure context; localhost is treated as secure for development.
- There is no push notification service, account recovery, conflict resolution, or multi-device sync.
- The Weekly Boss uses reviewed deterministic rule data rather than generated content or external AI.
- Lesson brief export remains browser print; no PDF file generator is included.

## Exact next backend phase

**Phase 6: authenticated Supabase backend and synchronization adapter, including schema migrations, row-level security, authenticated tutor/student ownership, and an explicit offline conflict policy. External AI, payments, and deployment remain separate opt-in work and must not start automatically.**

## Verification

- Prettier write and format check: passed
- ESLint: passed with zero warnings or errors
- Strict TypeScript and Next.js route type generation: passed
- Prettier write and format check: passed
- ESLint: passed with zero warnings or errors
- Strict TypeScript and Next.js route type generation: passed
- Vitest repeated stability run: 13 files and 54 tests passed in each of two consecutive runs
- Playwright development run: 20 passed, 2 intentionally skipped production-only offline cases
- Playwright production run: 21 passed, 1 intentionally skipped duplicate mobile offline case; desktop Chromium verified the full offline mission resume
- Accessibility: six representative desktop/mobile axe audits passed with zero serious or critical violations
- Production build: passed; 23 route entries generated, including 4 dynamic routes
- Browser QA: passed at 1440×900, 834×1112, and 375×812 with no horizontal overflow, broken navigation, or application console warnings/errors

# TraceTutor Build State

## Current phase

**Phase 3: complete and verified.**

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

## Deferred by design

- Authentication and authorization
- Remote data and Supabase
- Tutor editing and verification actions
- External AI diagnosis or generated content
- Payments, remote notifications, and deployment
- Official score estimates or predictions

## Verification

- Prettier write and format check: passed
- ESLint: passed with zero warnings or errors
- Strict TypeScript and Next.js route type generation: passed
- Vitest: 11 files passed, 40 tests passed
- Playwright: 8 tests passed across desktop Chromium and Pixel 7 profiles
- Production build: passed; 11 routes generated, including the dynamic student mission route
- Browser QA: passed for onboarding → diagnosis → probe → transfer → schedule and Mistake Map at 1440×900 and 375×812, with no horizontal overflow or console errors

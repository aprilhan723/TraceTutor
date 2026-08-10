# TraceTutor Architecture

## Runtime and framework

- Next.js 16.3.0 App Router
- React 19.2
- TypeScript with strict checking and JavaScript disabled
- Tailwind CSS 4
- ESLint 9 with Next.js Core Web Vitals and TypeScript rules
- npm lockfile and package manager declaration

The official Webpack opt-in is used for local development and production builds because this managed environment blocks the loopback worker port used by Turbopack’s PostCSS evaluation. No custom Webpack configuration is present.

Next.js currently requires Node.js 20.9 or newer. The project is verified with Node.js 24.14.0.

## Application boundaries

```text
App Router pages and client experience components
    ↓
StudentDemoProvider / TutorDemoProvider
    ↓
LearningService
    ↓
LearningRepository interface
    ↓
LocalDemoLearningRepository (Phase 5)
    ↓
Browser localStorage / typed seeded fallback
```

Route components do not depend on the storage implementation. The student and tutor providers own browser service instances, serialize mutations, and republish typed snapshots. Both providers use the same repository keys, so tutor adjudication appears in the student weekly report after navigation or refresh. A later Supabase adapter can implement `LearningRepository` and be injected into `LearningService` without changing either UI.

## Student study aggregate

- `StudentOnboarding` stores the five personalization inputs.
- `StudentStudyState` version 4 is the aggregate for onboarding, attempts, reviews, mission history, diagnosis records, probe responses, retention schedules, mistake patterns, the ethical streak ledger, Recovery Pass uses, celebrated milestones, offline events, and active/parked missions.
- `StudentMission` contains deterministic entry references, drafts, current position, timing, and completion state.
- `PracticeItem` is a discriminated union for Complete the Words, evidence-based reading questions, and transfer checks.
- `StudyAttempt` records the submitted answer, confidence, evidence IDs, elapsed seconds, answer changes, diagnosis link, and transparent Secure/Unstable/Diagnose result.
- `DiagnosisRecord` snapshots all known observations and the current bounded hypothesis, including taxonomy version, probe link, tutor-review flag, and remediation target.
- `RetentionSchedule` links one diagnosis to a unique Immediate, D2, or D7 transfer item and its eventual attempt outcome.
- `StudentPatternRecord` aggregates a cause/process pair without erasing its diagnosis evidence, distinct transfer surfaces, retention cadence state, or recurrence history.
- `MissionMode` distinguishes standard, Light Day, Weekly Boss, and tutor-assigned work. History snapshots the exact qualifying streak reason.
- `Clock` isolates the deterministic demo date from real wall-clock behavior. `LocalDemoClock` persists a demo-only date override so D2 and D7 can be demonstrated without waiting.

The local adapter serializes the aggregate under `tracetutor.demo.study.v4`. Validated v2 and v3 aggregates are migrated in place so onboarding, drafts, attempts, mission progress, and Phase 3 diagnosis data survive the upgrade. The adapter safely falls back to an original seed state if storage is unavailable or malformed.

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

## Source map

- `src/app/` — routes, layouts, metadata, and framework states
- `src/components/` — shared product and UI components
- `src/domain/` — storage-independent entities, versioned taxonomies, and repository contracts
- `src/data/` — original practice content, reviewed diagnostic metadata, six structured probes, transfer bank, student and tutor seed state, and local repository adapter
- `src/services/` — pure diagnosis, Complete the Words analysis, transfer/retention logic, mission selection, tutor operations, evaluation, analytics, persistence orchestration, and UI data assembly
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

- Vitest + Testing Library for taxonomy boundaries, diagnosis rules, Complete the Words layers, mission selection, persistence, transfer/retention, queue ranking, adjudication audit history, content validation/versioning, lesson-brief selection, report calculations, service integration, and components
- Playwright coverage for onboarding and full mission completion, high-confidence wrong diagnosis and transfer, demo-clock D2/D7 review, tutor queue → diagnosis → transfer → lesson brief, offline-safe resume, and representative axe-core accessibility audits in desktop Chromium and Pixel 7 profiles
- ESLint, strict TypeScript, Prettier, and production build checks

## Future adapter notes

A future Supabase adapter should map database rows into both aggregates at the adapter boundary and replace demo-wide storage with authenticated row ownership. Authentication, row-level access, migrations, remote synchronization, and external AI inference remain intentionally absent. UI code must continue to call `LearningService` rather than importing seeded records or browser storage directly.

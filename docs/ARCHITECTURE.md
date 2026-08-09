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
StudentDemoProvider
    ↓
LearningService
    ↓
LearningRepository interface
    ↓
LocalDemoLearningRepository (Phase 3)
    ↓
Browser localStorage / typed seeded fallback
```

Route components do not depend on the storage implementation. `StudentDemoProvider` owns the browser service instance, serializes mutations, and republishes typed snapshots. A later Supabase adapter can implement `LearningRepository` and be injected into `LearningService` without changing the student or tutor UI.

## Phase 3 domain model

- `StudentOnboarding` stores the five personalization inputs.
- `StudentStudyState` version 3 is the aggregate for onboarding, attempts, reviews, mission history, diagnosis records, probe responses, retention schedules, mistake patterns, streak, Recovery Pass, and the active mission.
- `StudentMission` contains deterministic entry references, drafts, current position, timing, and completion state.
- `PracticeItem` is a discriminated union for Complete the Words, evidence-based reading questions, and transfer checks.
- `StudyAttempt` records the submitted answer, confidence, evidence IDs, elapsed seconds, answer changes, diagnosis link, and transparent Secure/Unstable/Diagnose result.
- `DiagnosisRecord` snapshots all known observations and the current bounded hypothesis, including taxonomy version, probe link, tutor-review flag, and remediation target.
- `RetentionSchedule` links one diagnosis to a unique Immediate, D2, or D7 transfer item and its eventual attempt outcome.
- `StudentPatternRecord` aggregates a cause/process pair without erasing its diagnosis evidence, distinct transfer surfaces, retention cadence state, or recurrence history.
- `Clock` isolates the deterministic demo date from real wall-clock behavior so mission selection and tests remain stable.

The local adapter serializes the aggregate under `tracetutor.demo.study.v3`. A validated v2 aggregate is migrated in place so Phase 2 onboarding, drafts, attempts, and mission progress survive the upgrade. The adapter safely falls back to an original seed state if storage is unavailable or malformed. Reset removes both current and legacy aggregates only after an explicit confirmation.

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
- `src/data/` — original practice content, reviewed diagnostic metadata, six structured probes, transfer bank, seed state, and local repository adapter
- `src/services/` — pure diagnosis, Complete the Words analysis, transfer/retention logic, mission selection, evaluation, analytics, persistence orchestration, and UI data assembly
- `src/content/` — typed static marketing content
- `src/test/` — shared unit test setup
- `e2e/` — Playwright student journeys and shell smoke tests

## Rendering strategy

Pages and layouts remain Server Components by default. The student gate and dashboards are Client Components because onboarding, autosave, timer, probes, and resume behavior require browser storage and interaction. `StudentDemoProvider` keeps persistence concerns outside route components. Repository reads and writes remain asynchronous even though the Phase 3 adapter is local, preserving the contract expected by a remote adapter.

## Accessibility

- Semantic landmarks, sections, headings, lists, and navigation labels
- Skip links on public and app surfaces
- Visible keyboard focus states
- Minimum 40–56 px interactive targets
- `aria-current` navigation state
- Native fieldsets, radio groups, labels, and disabled sequencing controls
- `aria-pressed` evidence segments with visible text labels
- Modal focus placement, dialog semantics, and explicit reset confirmation
- Accessible progressbar values and labels
- Reduced-motion support

## Responsive layout

Marketing layouts are mobile-first and progressively move to two- or three-column grids. The application uses a fixed desktop sidebar at the `lg` breakpoint and a safe-area-aware bottom navigation below it. Practice mode suppresses app navigation to preserve focus and uses a compact header that remains usable at approximately 375 px.

## Testing and quality

- Vitest + Testing Library for taxonomy boundaries, table-driven diagnosis rules, contradictory evidence, Complete the Words layers, mission selection, persistence migration, resume behavior, transfer scheduling, state transitions, VECR-7, service integration, and components
- Playwright coverage for onboarding/resume and wrong-certain → evidence → probe → likely diagnosis → immediate transfer → retention schedule in desktop Chromium and Pixel 7 profiles
- ESLint, strict TypeScript, Prettier, and production build checks

## Future adapter notes

A future Supabase adapter should map database rows into the Phase 3 domain types at the adapter boundary. Authentication, row-level access, migrations, remote synchronization, external AI inference, and tutor mutations remain intentionally absent. UI code must continue to call `LearningService` rather than importing seeded records or browser storage directly.

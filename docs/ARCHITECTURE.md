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
LocalDemoLearningRepository (Phase 2)
    ↓
Browser localStorage / typed seeded fallback
```

Route components do not depend on the storage implementation. `StudentDemoProvider` owns the browser service instance, serializes mutations, and republishes typed snapshots. A later Supabase adapter can implement `LearningRepository` and be injected into `LearningService` without changing the student or tutor UI.

## Phase 2 domain model

- `StudentOnboarding` stores the five personalization inputs.
- `StudyState` is the versioned aggregate for onboarding, attempts, reviews, mission history, mistake patterns, streak, Recovery Pass, and the active mission.
- `Mission` contains deterministic entry references, drafts, current position, timing, and completion state.
- `PracticeItem` is a discriminated union for Complete the Words and evidence-based reading questions.
- `Attempt` records the submitted answer, confidence, evidence IDs, and transparent Secure/Unstable/Diagnose result.
- `Clock` isolates the deterministic demo date from real wall-clock behavior so mission selection and tests remain stable.

The local adapter serializes `StudyState` under `tracetutor.demo.study.v2`. It safely falls back to an original seed state if storage is unavailable or malformed. Reset removes the persisted aggregate only after an explicit confirmation.

## Source map

- `src/app/` — routes, layouts, metadata, and framework states
- `src/components/` — shared product and UI components
- `src/domain/` — storage-independent entities and repository contracts
- `src/data/` — original practice content, seed state, and local repository adapter
- `src/services/` — mission selection, answer evaluation, analytics, persistence orchestration, and UI data assembly
- `src/content/` — typed static marketing content
- `src/test/` — shared unit test setup
- `e2e/` — Playwright smoke tests

## Rendering strategy

Pages and layouts remain Server Components by default. The student gate and dashboards are Client Components because onboarding, autosave, timer, and resume behavior require browser storage and interaction. `StudentDemoProvider` keeps persistence concerns outside route components. Repository reads and writes remain asynchronous even though the Phase 2 adapter is local, preserving the contract expected by a remote adapter.

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

- Vitest + Testing Library for mission selection, answer normalization, repository persistence, resume behavior, services, and components
- Playwright onboarding-to-resume coverage in desktop Chromium and Pixel 7 profiles
- ESLint, strict TypeScript, Prettier, and production build checks

## Future adapter notes

A future Supabase adapter should map database rows into the Phase 2 domain types at the adapter boundary. Authentication, row-level access, migrations, remote synchronization, AI inference, and tutor mutations remain intentionally absent. UI code must continue to call `LearningService` rather than importing seeded records or browser storage directly.

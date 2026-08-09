# TraceTutor Architecture

## Runtime and framework

- Next.js 16.3.0 App Router
- React 19.2
- TypeScript with strict checking and JavaScript disabled
- Tailwind CSS 4
- ESLint 9 with Next.js Core Web Vitals and TypeScript rules
- npm lockfile and package manager declaration

The official Webpack opt-in is used for local development and production builds because this managed environment blocks the loopback worker port used by Turbopack’s PostCSS evaluation. No custom Webpack configuration is present.

Next.js currently requires Node.js 20.9 or newer. Phase 1 was built with Node.js 24.14.0.

## Application boundaries

```text
App Router pages
    ↓
Reusable product components
    ↓
LearningService
    ↓
LearningRepository interface
    ↓
LocalDemoLearningRepository (Phase 1)
    ↓
Typed in-memory mock records
```

Route components do not depend on the storage implementation. A later Supabase adapter can implement `LearningRepository` and be injected into `LearningService` without changing the student or tutor UI.

## Source map

- `src/app/` — routes, layouts, metadata, and framework states
- `src/components/` — shared product and UI components
- `src/domain/` — storage-independent entities and repository contracts
- `src/data/` — Phase 1 mock records and local repository adapter
- `src/services/` — UI-oriented data assembly and product operations
- `src/content/` — typed static marketing content
- `src/test/` — shared unit test setup
- `e2e/` — Playwright smoke tests

## Rendering strategy

Pages and layouts are Server Components by default. `AppShell` is a Client Component because it uses the current pathname to expose active navigation. All Phase 1 data reads are asynchronous even though the records are local, preserving the contract expected by a remote adapter.

## Accessibility

- Semantic landmarks, sections, headings, lists, and navigation labels
- Skip links on public and app surfaces
- Visible keyboard focus states
- Minimum 40–56 px interactive targets
- `aria-current` navigation state
- Native disabled controls for deferred Phase 2 actions
- Accessible progressbar values and labels
- Reduced-motion support

## Responsive layout

Marketing layouts are mobile-first and progressively move to two- or three-column grids. The application uses a fixed desktop sidebar at the `lg` breakpoint and a safe-area-aware bottom navigation below it.

## Testing and quality

- Vitest + Testing Library for service and component behavior
- Playwright smoke tests in desktop Chromium and Pixel 7 profiles
- ESLint, strict TypeScript, Prettier, and production build checks

## Future adapter notes

Phase 2 should add behavior through service methods and repository contracts rather than route-local state. A Supabase adapter should map database rows into domain types at the adapter boundary. Authentication, row-level access, migrations, and mutations are intentionally absent in Phase 1.

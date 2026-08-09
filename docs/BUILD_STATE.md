# TraceTutor Build State

## Current phase

**Phase 2: complete and verified.**

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

## Deferred by design

- Authentication and authorization
- Remote data and Supabase
- Tutor editing and verification actions
- AI diagnosis or generated content
- Payments, remote notifications, and deployment
- Official score estimates or predictions

## Verification

- Prettier formatting: passed
- ESLint: passed with zero warnings or errors
- Strict TypeScript and Next.js route type generation: passed
- Vitest: 5 files passed, 8 tests passed
- Playwright: 6 tests passed across desktop Chromium and Pixel 7 profiles
- Production build: passed; 11 routes generated, including the dynamic student mission route
- Browser QA: passed at 1440×900 and 375×812 with no horizontal overflow or console errors

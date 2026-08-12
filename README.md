# TraceTutor

**Practice less randomly. Correct what keeps repeating.**

TraceTutor is a tutor-verified mistake-correction workspace for the 2026 TOEFL Reading experience. It turns a learner's answer, confidence, and evidence trace into a short correction loop that a tutor can review before the next lesson.

[Open the live product](https://project-qiel2.vercel.app) · [Inspect both demo roles](https://project-qiel2.vercel.app/demo) · [Review the founding tutor pilot](https://project-qiel2.vercel.app/pilot)

## Why it exists

Question banks are good at producing more attempts. TraceTutor focuses on what happens after a wrong answer:

1. **Answer** — commit to a response.
2. **Evidence** — trace the exact textual support.
3. **Diagnose** — keep observations separate from likely causes.
4. **Transfer** — apply the correction on a distinct surface.
5. **Retain** — revisit it immediately, on Day 2, and on Day 7.

The product covers Complete the Words, Read in Daily Life, and Read an Academic Passage with original practice content. It does not copy official questions or passages.

## Two connected experiences

### Student

- Personalized Daily Core and longer 10–120 minute study sessions
- Evidence-first responses, confidence calibration, and refresh-safe drafts
- Mistake Map, D2/D7 reviews, active-time accounting, and honest progress
- Offline-safe browser-local Demo Mode with a deterministic Weekly Boss

### Tutor

- Transparent intervention ranking with every priority factor explained
- Full answer/evidence/probe/retention traces before adjudication
- Immutable separation between machine suggestions and tutor decisions
- Versioned content, lesson briefs, recommendations, and weekly reports

## Founding tutor pilot

The public beta currently collects no payment. The working pricing hypothesis is **$49 per tutor per month for up to 12 active students** after billing is deliberately introduced. The pilot page states this as a hypothesis—not a checkout offer—so early users can evaluate the workflow before any charge.

The best-fit pilot user is an independent tutor with 3–12 active TOEFL Reading students who already uses original or properly licensed material.

## Run locally

Requirements: Node.js 24 and npm 11.

    npm install
    npm run dev

Open [http://localhost:3000](http://localhost:3000). No environment variable, remote database, payment provider, or API key is required for Demo Mode.

## Quality gates

    npm run format:check
    npm run lint
    npm run typecheck
    npm test
    npm run test:e2e
    npm run test:rls
    npm run scan:secrets
    npm run build

GitHub Actions runs the non-browser release gates on every push and pull request. Connected Supabase tests remain separately gated because they create disposable accounts and must never target a project containing real learners.

## Architecture and trust

- Next.js App Router, strict TypeScript, React Server Components by default
- Storage-agnostic LearningRepository and LearningService boundary
- Complete local adapter plus opt-in Supabase SSR account adapter
- Explicit RLS across every exposed relational table
- Rule-first diagnosis; optional server-only AI remains disabled by default
- No browser service-role key, no official score estimate, and no paid live AI test

Start with [the product specification](docs/PRODUCT_SPEC.md), [architecture](docs/ARCHITECTURE.md), and [current build state](docs/BUILD_STATE.md).

## Public-source boundary

The repository is public for product transparency and evaluation. No reuse license is granted yet; see [LICENSE](LICENSE). Bug reports and pilot feedback are welcome, but outside code contributions are paused while the commercial and licensing model is validated.

## Independent-product notice

TraceTutor is independent practice software and is not endorsed by or affiliated with ETS. TOEFL is a registered trademark of ETS. Practice feedback and progress signals are not official TOEFL scores or score predictions.

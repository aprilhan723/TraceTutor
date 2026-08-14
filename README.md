# TraceTutor

**Practice less randomly. Correct what keeps repeating.**

[![Quality gates](https://github.com/aprilhan723/TraceTutor/actions/workflows/ci.yml/badge.svg)](https://github.com/aprilhan723/TraceTutor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-6f42c1.svg)](LICENSE)
[![Status: public beta](https://img.shields.io/badge/status-public_beta-e76f51.svg)](https://project-qiel2.vercel.app)

TraceTutor is an open-source, tutor-verified mistake-correction workspace for TOEFL Reading practice. It turns a learner's answer, confidence, and evidence trace into a short correction loop that a tutor can review before the next lesson.

[Open the live account beta](https://project-qiel2.vercel.app) · [Try both fictional demo roles](https://project-qiel2.vercel.app/demo) · [Read the architecture](docs/ARCHITECTURE.md) · [See the roadmap](ROADMAP.md)

## Why it exists

Question banks are good at producing more attempts. TraceTutor focuses on what happens after a wrong answer:

1. **Answer** — commit to a response.
2. **Evidence** — trace the exact textual support.
3. **Diagnose** — keep observations separate from likely causes.
4. **Transfer** — apply the correction on a distinct surface.
5. **Retain** — revisit it immediately, on Day 2, and on Day 7.

The repository is also a reference implementation for teams exploring:

- local-first education demos that need no account, database, or API key;
- an optional hosted account mode behind the same repository/service boundary;
- row-level security for linked tutor and student workspaces;
- rule-first diagnosis with optional AI assistance that remains subject to human review;
- privacy-aware educational issue forms, fixtures, and contribution rules.

See [the reuse guide](docs/REUSE.md) for the parts designed to be adapted.

## Two connected experiences

### Student

- Personalized Daily Core and longer 10–120 minute study sessions
- Evidence-first responses, confidence calibration, and refresh-safe drafts
- Mistake Map, D2/D7 reviews, active-time accounting, and honest progress
- Offline-safe browser-local Demo Mode with a deterministic Weekly Boss

### Tutor

- Transparent intervention ranking with every priority factor explained
- Full answer, evidence, probe, and retention traces before adjudication
- Immutable separation between machine suggestions and tutor decisions
- Versioned content, lesson briefs, recommendations, and weekly reports

## Try it without setup

The hosted [Demo Mode](https://project-qiel2.vercel.app/demo) uses fictional data and does not require an account. It is intentionally separate from the account beta.

To run the same mode locally:

```bash
npm install
npm run dev
```

Open [http://localhost:3000/demo](http://localhost:3000/demo). Requirements are Node.js 24 and npm 11. No environment variable, remote database, payment provider, or API key is required.

## Runtime modes

| Mode               | Storage           | External services | Intended use                                        |
| ------------------ | ----------------- | ----------------- | --------------------------------------------------- |
| Demo               | Browser-local     | None              | Product evaluation, development, and safe examples  |
| Account beta       | Supabase with RLS | Supabase          | Invited learner and tutor pilot workflows           |
| Optional AI assist | Server-only       | OpenAI API        | Ambiguous diagnosis assistance; disabled by default |

The complete Demo Mode must continue to work when every optional integration is absent.

## Current status

TraceTutor is an early public beta maintained by one primary maintainer. The repository does **not** claim broad adoption or proven learning efficacy. Current evidence covers reproducible builds, automated tests, security boundaries, a deployed beta, and a founding-tutor workflow ready for real-world evaluation.

The public beta currently collects no payment. The displayed **$49 per tutor per month for up to 12 active students** is a pricing hypothesis for a later phase, not a checkout offer.

See [BUILD_STATE](docs/BUILD_STATE.md) for dated verification records and known limitations.

## Quality gates

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run test:rls
npm run scan:secrets
npm run build
```

GitHub Actions runs the non-browser release gates on every push and pull request. Connected Supabase tests remain separately gated because they create disposable accounts and must never target a project containing real learners.

## Architecture and trust

- Next.js App Router, strict TypeScript, and React Server Components by default
- Storage-agnostic `LearningRepository` and `LearningService` boundary
- Complete local adapter plus opt-in Supabase SSR account adapter
- Explicit RLS across every exposed relational table
- Rule-first diagnosis; optional server-only AI remains disabled by default
- No browser service-role key, no official score estimate, and no paid live AI test
- Original fictional practice material rather than copied test questions or passages

Start with [the product specification](docs/PRODUCT_SPEC.md), [architecture](docs/ARCHITECTURE.md), and [current build state](docs/BUILD_STATE.md).

## Contributing

Code, documentation, accessibility fixes, tests, and privacy-safe product feedback are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md), follow the [Code of Conduct](CODE_OF_CONDUCT.md), and check the [public roadmap](ROADMAP.md).

AI-assisted contributions are welcome when the contributor reviews the result, runs the required checks, and discloses material assistance in the pull request. Contributors remain responsible for every submitted change.

Never include learner records, credentials, private workspace links, official test questions, copyrighted passages, or hidden assessment material.

## Security and support

Report vulnerabilities through the private process in [SECURITY.md](SECURITY.md). Use [SUPPORT.md](SUPPORT.md) for product and setup questions. Do not post sensitive learner or account information in a public issue.

## Governance and releases

TraceTutor currently uses a maintainer-led model documented in [GOVERNANCE.md](GOVERNANCE.md). User-visible and security-relevant changes are recorded in [CHANGELOG.md](CHANGELOG.md). Public releases are cut from a green `main` branch.

## License

TraceTutor source code and original repository documentation are available under the [MIT License](LICENSE). Third-party dependencies and trademarks remain subject to their own terms. The `"private": true` package setting prevents accidental npm publication; it does not restrict the MIT-licensed source.

## Independent-product notice

TraceTutor is independent practice software and is not endorsed by or affiliated with ETS. TOEFL is a registered trademark of ETS. Practice feedback and progress signals are not official TOEFL scores or score predictions.

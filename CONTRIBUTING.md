# Contributing to TraceTutor

Thank you for helping make mistake correction more transparent, useful, and privacy-aware.

## Ways to contribute

- Fix a reproducible bug
- Improve accessibility, responsive behavior, or offline resilience
- Add or strengthen tests
- Clarify setup, architecture, privacy, or teaching-workflow documentation
- Propose reusable repository, RLS, or human-review patterns
- Share de-identified pilot feedback
- Improve original fictional practice material without copying official content

For a substantial change, open an issue before implementation so the scope and product boundaries can be agreed on. Small documentation fixes may go directly to a pull request.

## Local setup

Requirements:

- Node.js 24
- npm 11

```bash
npm install
npm run dev
```

Demo Mode requires no environment variables. Copy `.env.example` only when deliberately testing an optional integration.

## Required checks

Run the checks relevant to your change. Before a merge, the full release gate is:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:rls
npm run scan:secrets
npm run build
```

Run `npm run test:e2e` for user-facing behavior. Connected Supabase tests must use a disposable local project, never a hosted project containing real learners.

## Pull request expectations

A pull request should:

1. Explain the problem and the user impact.
2. Keep the diff focused.
3. List the checks that were run and their results.
4. Add or update tests when behavior changes.
5. Update `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, or `docs/BUILD_STATE.md` when the documented contract changes.
6. Confirm that no learner data, credentials, private URLs, or restricted test material is included.
7. Disclose material AI assistance.

Draft pull requests are welcome for early design feedback. A maintainer may ask that a broad proposal be split into smaller changes.

## AI-assisted contributions

AI-assisted work is welcome. The human contributor remains accountable for the design, accuracy, licensing, security, and test results.

When AI materially shaped a contribution:

- describe what it helped produce or review;
- inspect every generated change rather than submitting it blindly;
- verify claims against the code and current documentation;
- never paste credentials, learner records, private support conversations, or licensed assessment content into a model;
- run the same checks required for a human-written change.

Using an agent does not reduce the review or evidence standard.

## Product and content guardrails

- Keep product UI and demo learning content in English unless an accepted issue changes that scope.
- Keep TraceTutor independent from ETS and never present practice feedback as an official score.
- Use only original or properly licensed practice material.
- Separate observed learner behavior from hypotheses about hidden causes.
- Keep tutor adjudication as the final boundary for diagnosis.
- Preserve a complete zero-secret Demo Mode.
- Never weaken authorization, RLS, privacy, or tests to simplify a contribution.
- Do not add tracking, payments, live AI, or a secret requirement without an accepted design issue.

## Privacy-safe examples

Use fictional people, `example.com` or `example.test` email addresses, and synthetic identifiers. Remove screenshots or logs that contain names, email addresses, invite links, credentials, or workspace URLs.

Do not open a public issue for a vulnerability. Follow [SECURITY.md](SECURITY.md).

## Review and decision process

The maintainer evaluates changes for user value, evidence quality, privacy and security, architectural fit, maintenance cost, and test coverage. See [GOVERNANCE.md](GOVERNANCE.md) for the decision model.

By contributing, you agree that your contribution is licensed under the repository's [MIT License](LICENSE) and that you have the right to submit it.

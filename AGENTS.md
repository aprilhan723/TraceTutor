<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TraceTutor working agreement

## Product guardrails

- TraceTutor is a tutor-verified daily mistake-correction product for TOEFL Reading, not a question bank.
- Keep all product UI and demo learning content in English.
- Always state that TraceTutor is independent software, is not endorsed by ETS, and does not provide official TOEFL scores.
- Preserve the visual system: warm off-white canvas, ink typography, coral actions, violet diagnostics, and mint success states.
- Do not copy mascots, branded test questions, or copyrighted passages. All examples must be original.

## Engineering guardrails

- Use the Next.js App Router, strict TypeScript, semantic HTML, and accessible interaction patterns.
- Prefer Server Components. Add `"use client"` only for real browser interaction or framework hooks.
- UI reads data through `LearningService` and `LearningRepository`; do not import mock records directly into route components.
- The repository contract must remain storage-agnostic so a later Supabase adapter does not require UI rewrites.
- Keep dependencies few, maintained, and justified. Never add a secret requirement for demo mode.
- Run format checking, lint, typecheck, unit tests, E2E smoke tests when supported, and a production build before committing.
- Do not weaken checks with `@ts-ignore`, `any`, disabled lint rules, or deleted tests.

## Phase discipline

- Read `docs/BUILD_STATE.md` before starting a new phase.
- Update `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, and `docs/BUILD_STATE.md` whenever behavior or architecture changes.
- Phase 1 established the presentation shells and storage-agnostic repository boundary.
- Phase 2 adds the complete local student sprint, deterministic original content, rule-based feedback, and browser persistence. Keep authentication, payments, Supabase, AI diagnosis, tutor mutations, official score estimates, and deployment out until a later phase explicitly requests them.

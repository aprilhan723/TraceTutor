# TraceTutor AI Evaluation

## Scope

Phase 7 evaluates an optional diagnosis-disambiguation adapter. It does not evaluate autonomous tutoring, practice-content generation, or score prediction. The deterministic rule trace and tutor gold label remain the comparison anchors.

## Fixture set

`src/ai/evaluation/fixtures.ts` defines de-identified fixture version `2026-08-11.v1` from original TraceTutor demo relations. The six cases cover:

1. scope expansion agreement;
2. an actor-mismatch rule/model contradiction;
3. modality retention agreement;
4. time-mismatch agreement;
5. low-confidence language-form abstention;
6. prompt injection embedded in student text.

No fixture contains a name, email, class roster, key, or copied ETS material.

## Required checks

`npm run test:ai` runs mocked checks for:

- strict input/output schema validity and rejection;
- agreement with tutor gold causes;
- explicit rule/model contradiction routing;
- low, medium, and high confidence buckets;
- abstention and mandatory tutor-review behavior;
- student-text prompt-injection containment;
- absent key, disabled flag, timeout, malformed output, provider failure, circuit breaker, rate limits, and idempotency;
- separate rule, AI, and tutor audit records.

Normal test and E2E runs do not call the OpenAI API. A paid live evaluation requires a separate explicit approval, a blinded fixture plan, a budget, and a documented decision threshold. The presence of `OPENAI_API_KEY` alone never enables or triggers a request.

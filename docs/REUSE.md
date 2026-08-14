# Reusing TraceTutor

TraceTutor is MIT-licensed so educators and developers can study, run, modify, and redistribute the software. This guide identifies the parts intended to be reusable and the boundaries a fork must preserve.

## Useful reference patterns

### Zero-secret Demo Mode

The complete fictional workspace runs without an account, remote database, or API key. It is useful for product evaluation, workshops, offline-safe prototypes, and contributor onboarding.

### Storage-agnostic learning boundary

UI routes read through `LearningService` and `LearningRepository`. A fork can replace the local or Supabase adapter without rewriting route components.

### Tutor-verified diagnosis

Deterministic observations and machine hypotheses remain separate from append-only tutor decisions. Optional model assistance is server-only, disabled by default, and never becomes learner-facing truth without review.

### Linked-role authorization

The Supabase migrations demonstrate explicit RLS for tutor, learner, organization, invitation, content, attempt, and adjudication relationships. The static verifier and pgTAP fixtures document the intended isolation.

### Evidence-led retention loop

Answer, evidence, diagnosis, transfer, and D2/D7 review are modeled as separate, testable stages rather than one opaque score.

## Start a fork safely

1. Run Demo Mode with no environment variables.
2. Replace the brand name and visual assets if creating a distinct product.
3. Replace all fictional practice content with material you created or have permission to use.
4. Preserve the independent-product notice for any trademarked assessment you reference.
5. Run the complete quality gates.
6. Use a new Supabase project and apply migrations in order.
7. Verify RLS with synthetic accounts before inviting any learner.
8. Configure only public Supabase values in browser variables.
9. Keep service-role and model keys server-only and out of Git history.
10. Publish your own privacy policy, security contact, and operational limitations.

## Content and trademark boundary

The MIT license covers TraceTutor's original source and repository documentation. It does not grant rights to third-party trademarks, dependency code under other licenses, or material a contributor had no right to submit.

TOEFL is a registered trademark of ETS. TraceTutor is independent software and is not endorsed by ETS. Do not copy official questions, passages, answer keys, score scales, or branded assets into a fork.

## Commercial use

MIT permits commercial use. A hosted fork remains responsible for privacy law, data processing terms, security operations, third-party service costs, trademarks, and the licenses of its own content and dependencies.

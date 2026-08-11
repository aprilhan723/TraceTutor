# TraceTutor Preview Rollback

## Preview-only rollback policy

Vercel Preview deployments are immutable URLs and are not the production site. A Phase 8 rollback therefore means creating a new Preview from the last verified commit, verifying it, and sharing that replacement URL. Do not promote either deployment, change production aliases, delete deployments, or reset remote data.

## When to roll back

Create a replacement preview if the active preview has a broken core route, a serious accessibility or security regression, exposed configuration, persistent server errors, or inconsistent student/tutor state.

## Non-destructive procedure

1. Record the failing Preview URL, deployment ID, commit hash, and observed error.
2. Identify the last locally verified commit with `git log --oneline`.
3. Create a temporary worktree for that commit; do not reset or overwrite the current working tree.
4. In the temporary worktree, run the preflight checks from `docs/DEPLOYMENT_RUNBOOK.md`.
5. Deploy it with `vercel deploy --target=preview --logs` using the same Vercel project and Preview-only environment.
6. Run the post-deployment smoke checks against the replacement URL.
7. Stop sharing the failing URL and share the verified replacement URL.
8. Keep both immutable deployment records for auditability. Do not delete or modify remote application data.

## Immediate containment

If a secret is suspected to be exposed, stop sharing the preview, disable the affected Preview-only integration in the platform UI, rotate the credential at its provider without posting it anywhere, and deploy a corrected preview. TraceTutor does not use a service-role key in the browser or current preview.

## Current rollback target

Before Phase 8 changes, the last fully verified local release commit is `0e0d7cd870911387034fd3f0983d2c22585a8daa`. After Phase 8 is committed, use the Phase 8 commit as the new baseline and retain this hash as the prior application-code fallback. The currently verified Preview is `https://project-qiel2-q374ocqnt-1-8746.vercel.app`; rollback creates a new Preview rather than mutating this immutable deployment.

# Governance

TraceTutor currently uses a maintainer-led governance model appropriate for an early-stage project.

## Maintainer

The primary maintainer is [@aprilhan723](https://github.com/aprilhan723).

The maintainer is responsible for:

- product and architecture direction;
- issue triage and review;
- privacy, security, and educational-content boundaries;
- release decisions and changelog accuracy;
- repository access and community enforcement;
- honest statements about adoption, efficacy, and product limitations.

Additional maintainers may be invited after sustained, trusted contributions. Repository access is never granted only to accelerate a single pull request.

## How decisions are made

Most changes follow this path:

1. A problem or proposal is described in an issue.
2. The expected user impact and boundaries are discussed.
3. A focused pull request supplies implementation and evidence.
4. Automated checks and maintainer review pass.
5. The change is merged and, when user-visible, recorded for release.

The maintainer seeks consensus but makes the final decision when consensus is not possible. Decisions prioritize:

1. learner privacy and account security;
2. truthful educational claims and human review;
3. accessible user value;
4. architectural clarity and local Demo Mode independence;
5. reproducible evidence and tests;
6. long-term maintenance cost.

Security fixes and urgent privacy corrections may use a private process before public discussion.

## Issue triage

Issues may be labeled as bug, accessibility, documentation, security-adjacent, pilot, enhancement, good first issue, or needs-design. A closed issue is not necessarily a judgment about the idea; it may be out of scope, duplicated, missing evidence, or unsuitable for the current maintenance capacity.

No response-time guarantee is made. The maintainer will prefer a small number of well-scoped, maintained issues over an inflated backlog.

## Pull requests

Opening a pull request does not guarantee merge. Significant work should begin with an accepted issue. Reviews may require changes for privacy, licensing, architecture, accessibility, or evidence quality even when the code works.

Contributors retain copyright in their work and license accepted contributions under MIT.

## Releases

Releases are cut from a green `main` branch. A release should include:

- a version tag and concise notes;
- passing required quality gates;
- an updated changelog for user-visible changes;
- documented migrations or rollback steps when relevant;
- no known credential or learner-data exposure.

Pre-release labels may be used while the hosted product remains in beta.

## Governance changes

Changes to this document use the same public issue and pull request process. Material governance changes should be called out in release notes.

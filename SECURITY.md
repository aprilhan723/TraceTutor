# Security Policy

TraceTutor handles educational records in its optional account mode, so privacy and authorization failures are treated as security issues.

## Supported versions

TraceTutor is an early beta. Security fixes are applied to the latest release and the `main` branch. Older deployments may not receive patches.

## Report a vulnerability privately

Do **not** open a public issue containing a vulnerability, credential, learner record, private workspace URL, invitation token, or exploit detail.

Use GitHub's private vulnerability reporting form:

<https://github.com/aprilhan723/TraceTutor/security/advisories/new>

If the form is unavailable, open a blank issue containing only the sentence “I need a private security reporting channel.” Include no technical or personal information. The maintainer will establish a private channel before asking for details.

A report is most useful when it includes:

- the affected route, component, or version;
- the smallest safe reproduction using fictional data;
- expected and observed authorization behavior;
- likely impact;
- any suggested mitigation.

The maintainer aims to acknowledge a report within 7 days and provide an initial severity assessment or request for more information within 14 days. These are response targets, not a paid support guarantee.

## Product security boundaries

- Demo Mode needs no account, API key, or remote database.
- Authenticated pages are private and excluded from the service-worker cache.
- Browser code never receives a Supabase service-role key or OpenAI key.
- Live AI is disabled by default and deterministic rules remain authoritative.
- Normal automated tests make no paid live model requests.
- Server actions and database functions repeat role and ownership checks; Proxy is not the authorization boundary.
- Public issues and fixtures must use fictional, de-identified data.

## Public beta limitations

TraceTutor is not an emergency, medical, financial, or institutional record system. Do not use it for secrets, protected health information, or student data you are not authorized to process.

The current beta has documented limitations around email verification, account recovery, backups, monitoring, and self-service deletion. See [BUILD_STATE](docs/BUILD_STATE.md) before using account mode with real learners.

## Disclosure

Please allow a reasonable remediation window before public disclosure. After a fix is available, the maintainer may publish a GitHub security advisory with credit to the reporter if they want attribution.

# Security

## Reporting a vulnerability

Do not open a public issue containing a vulnerability, credential, learner
record, private workspace URL, or exploit details.

Until a private reporting address is published, report only that you need a
private security channel through the repository's blank issue form. Include no
sensitive details. The maintainer will establish a private channel before
requesting technical information.

## Product boundaries

- Demo Mode needs no account, API key, or remote database.
- Authenticated pages are private and excluded from the service-worker cache.
- Browser code never receives a Supabase service-role key or OpenAI key.
- Live AI is disabled by default and deterministic rules remain authoritative.
- Normal automated tests make no paid live model requests.

TraceTutor is a public beta. Do not use it for secrets, protected health
information, or student data you are not authorized to process.

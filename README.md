# TraceTutor

TraceTutor is a mobile-first TOEFL Reading Correction Sprint: ten focused minutes to stop repeating the same Reading mistake, with a tutor-facing trace for pre-lesson intervention.

Phase 6 preserves the complete local sales demo and adds an opt-in authenticated Supabase architecture: cookie-based SSR auth, fixed tutor/student roles, one-time class invitations, normalized/versioned learning records, explicit row-level security, and server-validated idempotent writes.

## Local development

Requirements: Node.js 22 or newer and npm. Next.js itself supports Node 20.9+, but the current official Supabase client requires Node 22+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

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

No environment variable or API key is required for Demo Mode. To enable authenticated local workspaces, follow [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) and provide only the public Project URL and publishable key.

TraceTutor is independent practice software, not endorsed by or affiliated with ETS. Practice feedback is not an official TOEFL score.

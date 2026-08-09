# TraceTutor

TraceTutor is a mobile-first TOEFL Reading Correction Sprint: ten focused minutes to stop repeating the same Reading mistake, with a tutor-facing trace for pre-lesson intervention.

Phase 1 contains a production-quality marketing site, student and tutor demo shells, typed domain models, mock data, and a storage-agnostic service/repository foundation.

## Local development

Requirements: Node.js 20.9 or newer and npm.

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
npm run build
```

No environment variable or API key is required in Phase 1.

TraceTutor is independent practice software, not endorsed by or affiliated with ETS. Practice feedback is not an official TOEFL score.

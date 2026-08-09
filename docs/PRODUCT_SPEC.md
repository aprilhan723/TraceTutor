# TraceTutor Product Specification

## Product definition

- **Brand:** TraceTutor
- **Product label:** TOEFL Reading Correction Sprint
- **Phase:** 1 — product foundation and demo shells
  **Primary promise:** Practice less randomly. Correct what keeps repeating.

TraceTutor is not a question bank. It is a tutor-verified daily mistake-correction product for the 2026 TOEFL Reading experience. The student completes one focused correction sprint; the tutor sees the repeated reasoning pattern before the next lesson.

## Audience promises

- **Student:** Ten focused minutes to stop repeating the same Reading mistake.
- **Tutor:** See why a student is stuck before the next lesson.

## Product loop

1. **Answer** — commit to a response.
2. **Evidence** — trace exact textual support.
3. **Diagnose** — name the mistake pattern.
4. **Transfer** — apply the correction in a new context.
5. **Retain** — revisit the correction after time has passed.

Phase 1 visualizes this loop. Interactive answer, diagnosis, transfer, and retention behavior is explicitly deferred.

## 2026 Reading task coverage

- Complete the Words
- Read in Daily Life
- Read an Academic Passage

All demo examples are original. No copied test questions or passages are included.

## Phase 1 experience

### Public landing page

The landing page communicates the method, contrasts volume practice with mistake correction, explains student and tutor value, covers the three Reading task families, states trust boundaries, and routes into both demos.

### Student demo

- Responsive application shell
- Today Mission placeholder with a ten-minute evidence-drift focus
- Mistake Map preview based on typed mock patterns
- Progress empty state based on retention rather than volume
- Demo Mode indicator and tutor role switch

### Tutor demo

- Responsive application shell
- Intervention queue with one fictional priority student
- Student list placeholder
- Content library empty state
- Demo Mode indicator and student role switch

## Trust and trademark boundary

TraceTutor is independent practice software and is not endorsed by or affiliated with ETS. TOEFL is a registered trademark of ETS. Tutor verification refers to the intended workflow in which a tutor reviews mistake patterns and evidence traces; it does not imply ETS verification. Practice feedback, progress indicators, goals, and future product signals are not official TOEFL scores or score predictions.

## Out of scope for Phase 1

- Authentication and real user accounts
- Persistent student work
- Supabase or another remote backend
- Interactive questions and scoring
- Tutor content authoring
- Payments, subscriptions, or deployment
- Official score estimation

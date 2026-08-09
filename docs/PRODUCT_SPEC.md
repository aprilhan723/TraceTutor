# TraceTutor Product Specification

## Product definition

- **Brand:** TraceTutor
- **Product label:** TOEFL Reading Correction Sprint
- **Phase:** 2 — complete local student correction sprint
- **Primary promise:** Practice less randomly. Correct what keeps repeating.

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

Phase 2 makes this loop interactive for the student. Feedback is rule-based and transparent: it evaluates the submitted answer, confidence, and selected evidence without claiming to know the student's private reasoning.

## 2026 Reading task coverage

- Complete the Words
- Read in Daily Life
- Read an Academic Passage

All demo examples are original. No copied test questions or passages are included.

## Phase 2 student experience

### Onboarding and personalization

The first student demo entry collects a target test date, current Reading confidence, daily study time, preferred reminder time, and one main struggle. These values remain in local browser storage and shape the mission target, time budget, and task mix.

### Fourteen-day correction sprint

- One deterministic daily mission at a time across a 14-day sprint
- Due D2 and D7 retention reviews placed before new practice
- A standard ten-minute mission contains one due review when available, three Complete the Words items, one Daily Life or Academic item, and a transfer check when triggered
- Five- and fifteen-minute preferences produce shorter or expanded deterministic missions
- Correction Streak and Recovery Pass language instead of XP or game currency
- Autosaved drafts, elapsed time, attempts, mission completion, and refresh-safe resume

### Practice behavior

- Complete the Words uses typed missing endings with harmless capitalization and spacing normalization
- Daily Life and Academic items require answer, confidence, and evidence in sequence
- Evidence is selected from clearly separated, keyboard-accessible text segments
- Feedback is limited to Secure, Unstable, or Diagnose and never reveals future answers
- All questions, notices, passages, and paragraphs are original practice content, not official ETS material

### Content inventory

- 12 Complete the Words items
- 6 Read in Daily Life questions across 3 original stimuli
- 6 Read an Academic Passage questions across 2 original short passages
- 4 original transfer checks

### Progress surfaces

- Today shows the personalized mission, due reviews, target, estimate, and completion progress
- Mistake Map tracks New, Working, Unstable, Improving, and Resolved states
- Progress shows mission history, task-type accuracy, evidence accuracy, confidence calibration, and Correction Streak
- No official or unofficial score estimate is presented

## Preserved Phase 1 surfaces

### Public landing page

The landing page communicates the method, contrasts volume practice with mistake correction, explains student and tutor value, covers the three Reading task families, states trust boundaries, and routes into both demos.

### Tutor demo

- Responsive application shell
- Intervention queue with one fictional priority student
- Student list placeholder
- Content library empty state
- Demo Mode indicator and student role switch

## Trust and trademark boundary

TraceTutor is independent practice software and is not endorsed by or affiliated with ETS. TOEFL is a registered trademark of ETS. Tutor verification refers to the intended workflow in which a tutor reviews mistake patterns and evidence traces; it does not imply ETS verification. Practice feedback, progress indicators, goals, and future product signals are not official TOEFL scores or score predictions.

## Out of scope for Phase 2

- Authentication and real user accounts
- Supabase or another remote backend
- Tutor content authoring
- Tutor intervention mutations and verification workflow
- AI diagnosis or generated content
- Payments, subscriptions, or deployment
- Official score estimation

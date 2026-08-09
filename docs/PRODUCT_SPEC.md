# TraceTutor Product Specification

## Product definition

- **Brand:** TraceTutor
- **Product label:** TOEFL Reading Correction Sprint
- **Phase:** 3 — rule-first Mistake Intelligence
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

Phase 3 makes the loop diagnostic and retention-aware. Feedback remains rule-first and transparent: it separates observed answer behavior from a bounded, probabilistic hypothesis and never claims to know the student's private reasoning.

## 2026 Reading task coverage

- Complete the Words
- Read in Daily Life
- Read an Academic Passage

All demo examples are original. No copied test questions or passages are included.

## Student correction sprint

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
- 4 foundational transfer checks plus 12 reviewed Mistake Intelligence transfer surfaces

### Progress surfaces

- Today shows the personalized mission, due reviews, target, estimate, and completion progress
- Mistake Map tracks New, Working, Unstable, Improving, Resolved, and Recurring states
- Progress shows mission history, task-type accuracy, evidence accuracy, confidence calibration, and Correction Streak
- No official or unofficial score estimate is presented

## Phase 3 Mistake Intelligence

### Versioned multi-axis taxonomy

Taxonomy version 1 keeps five concepts independent instead of collapsing them into one mistake label:

- 8 task skills: main idea, detail, purpose, reference, vocabulary in context, inference, text structure, and Complete the Words language form
- 6 process stages: question encoding, evidence location, evidence interpretation, option comparison, constraint application, and monitoring/verification
- 16 causal hypotheses covering evidence, scope, polarity, modality, actor, time, condition, causal direction, main-point confusion, lexical meaning, grammar/morphology, and spelling
- 12 reviewed distractor relations, including too broad, wrong actor, wrong time, modality shift, and copied phrase/wrong relationship
- 8 behavioral contexts, including reported confidence, timing, answer changes, missing evidence, repeat errors, and reported guessing

### Rule-first diagnosis

The diagnosis service receives reviewed item metadata and observable attempt data. It returns known observations, at most one primary and two secondary hypotheses, a bounded confidence value, plain-language support, an optional discriminating probe, tutor-review status, intervention priority, and the next process/cause target.

Key product rules are explicit:

- Wrong answers without evidence create evidence-location risk.
- Wrong answers with overlapping keyed evidence shift the leading risk to interpretation, comparison, or constraint application.
- Reviewed too-broad, modality, actor, time, and condition tags map to their specific causal hypotheses.
- A certain wrong answer has high intervention priority and requires tutor review.
- A correct answer with guessing-level confidence or unsupported evidence is Unstable, not mastered.
- Unusually fast timing is recorded as context only.
- Every inferred cause is presented as “likely”; hidden mental states are never asserted as fact.

### Diagnostic probes

A single 15–20 second multiple-choice probe appears only when its contrast can distinguish plausible causes. The original probe bank covers quantifier/modality strength, passage information versus outside knowledge, correct versus merely mentioned actor, event date versus deadline, example versus main claim, and negative-question constraints. The response is stored and updates the supporting trace and diagnosis confidence transparently.

### Complete the Words analysis

Typed responses use a separate six-layer analysis: intended lemma, inflection/tense, derivational form/part of speech, spelling/edit distance, local grammar, and wider context. The engine differentiates a close misspelling from the wrong tense, wrong part of speech, or a contextually wrong word.

### Transfer and retention

- A reviewed bank supplies 12 original transfer surfaces grouped by reasoning trap and linked to error cause and task family.
- Immediate, Day 2, and Day 7 checks use different topics and wording while preserving the trap.
- Immediate transfer is inserted directly after a qualifying diagnosis; D2 and D7 become due mission reviews.
- State transitions support New → Working → Improving → Resolved, with Unstable and Recurring paths.
- Resolution requires secure performance across three distinct transfer items; repeating one memorized surface cannot resolve a pattern.
- VECR-7 measures the share of diagnoses retained at Day 7 and is shown only after a diagnosis has an eligible D7 opportunity.

### Mistake Map intelligence

Each pattern shows its causal hypothesis and process stage, recent observable evidence, Immediate/D2/D7 state, secure-return count, recurrence, and tutor-review status. The map describes rule-derived signals and does not present an official score or an AI-generated interpretation.

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

## Out of scope for Phase 3

- Authentication and real user accounts
- Supabase or another remote backend
- Tutor content authoring
- Tutor intervention mutations and verification workflow
- External AI diagnosis or generated content
- Payments, subscriptions, or deployment
- Official score estimation

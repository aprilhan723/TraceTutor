# TraceTutor Product Specification

## Product definition

- **Brand:** TraceTutor
- **Product label:** TOEFL Reading Correction Sprint
- **Phase:** 7 — optional tutor-reviewed AI assistance, with deterministic and local fallbacks preserved
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

Phase 7 adds a narrowly scoped, server-only OpenAI adapter without replacing any Phase 6 behavior. The model is consulted only when the deterministic trace contains multiple plausible causes or a short structured student explanation needs classification. Live AI is disabled by default, every normal test uses mocks, and provider failure returns the unchanged rule trace. Tutor adjudication remains the verification boundary.

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
- A visible day-by-day roadmap with two weekly mixed checkpoints and target-date countdown
- Correction Streak credit only for a due review, full correction loop, transfer check, or tutor-assigned mission; speed-item volume alone earns nothing
- One Recovery Pass per seven-day period protects a missed day without deleting due work
- A two-minute Light Day selects a due review or transfer when possible and states when no streak-eligible work exists
- Milestones for first tutor-verified correction, first secure D2, first secure D7, and three resolved patterns
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

## Phase 4 tutor workspace

### Action-first dashboard

- Today's Intervention Queue ranks only unresolved work and explains every contributing signal in plain language.
- The transparent score combines high-confidence wrong answers, recurrence, failed Day 7 retention, diagnosis ambiguity, test-date proximity, and unresolved student questions. It is an instructional sorting aid, not a psychological measure.
- Compact operational metrics cover unresolved diagnoses, high-confidence wrong answers, due or failed D2/D7 reviews, recently corrected errors, and median tutor review time.
- A ten-day adherence and accuracy trend supplies context without turning the page into a chart dashboard.

### Diagnosis verification

The review view keeps the original machine suggestion separate from tutor adjudication. Tutors can inspect the original stimulus, question, selected and correct options, selected and designated evidence, confidence, timing, answer changes, rule observations, probe response, alternate hypotheses, and transfer/retention history. They can approve or change the primary cause, manage secondary causes, assign a transfer item, request a follow-up, flag ambiguity, add the pattern to the next lesson, and send concise feedback. Every mutation appends a dated audit event.

### Student workspace

- Searchable roster with review-status filters, test dates, recent mission adherence, current patterns, task coverage, evidence accuracy, and confidence calibration
- Student detail with a ten-day review calendar, intervention history, tutor-only notes, and a student-facing weekly-summary preview
- Current patterns are presented as changeable learning signals, never as fixed personality labels

### Content library

The library exposes every original demo stimulus and item with task and skill filters, designated evidence, option-level distractor labels, and Draft, Reviewed, Published, or Retired status. The safe editor validates four complete options, exactly one keyed answer, source-backed evidence, and distractor tags. Editing published content creates a new immutable version so historical attempts keep their original content context.

### Lesson brief and weekly report

The next-lesson brief selects one to three verified priorities, cites evidence, proposes a 10–15 minute intervention, links two prompts, identifies mastered topics to skip, carries unresolved questions, and supports tutor notes and a clean print view. The student weekly report shows missions completed, verified corrections, improving/recurring/waiting patterns, confidence-calibration change, and next-week focus with no score estimate.

### Demo history

One fictional student has a deterministic ten-day history with mixed adherence, review outcomes, diagnoses, verification states, interventions, feedback, and content coverage. All tutor data remains locally persisted and can be reset with the shared confirmed demo reset.

## Phase 5 local release candidate

### Weekly Boss

“The Half-Truth Hydra” is an original geometric theme for a deterministic mixed challenge. It selects from the student’s most frequent reviewed distractor relations and current error causes, spans different task surfaces, and explains why every item was chosen. It is never treated as a personality label or mascot. Boss attempts do not generate diagnoses, mutate pattern status, or resolve a pattern; the normal distinct-transfer and D2/D7 criteria remain authoritative.

### Ethical engagement

The product deliberately excludes XP farming, fake scarcity, public rankings, punitive notifications, and shame. The Correction Streak represents qualifying correction work only. The roadmap, Recovery Pass, Light Day, and milestone moments make the work legible without claiming that attendance or challenge completion equals mastery.

Proof Sprout is the original visual companion for this system. It begins as a resting coral seed, grows a stem and leaves from meaningful Correction Streak days, gains a violet Day 2 evidence vein, forms a bud after a seven-day streak, and opens a mint bloom only after a secure Day 7 return. Three resolved patterns add small proof sparks, while an available Recovery Pass appears as a separate violet dew drop. Opening the app, speed-item volume, or a Weekly Boss result alone cannot grow it. Every visual state has an equivalent text label and reduced-motion behavior.

### PWA and offline behavior

- Standards-based web app manifest, original SVG/PNG icons, theme metadata, and installable standalone behavior
- Service worker caches the app shell, static assets, already-visited pages, and an explicitly downloaded active mission
- Offline mission drafts and attempts continue to use the same browser-local repository
- Offline attempt events are queued in the study aggregate and reconciled locally after reconnecting
- Offline copy clearly states that this phase has no account, server, or multi-device synchronization

### Product trust and polish

- Skippable, replayable three-step product tour
- Dedicated Trust, Privacy, Content Standards, and Method pages
- Consistent site metadata and original social preview artwork
- Segment loading/error states, visible independent-product disclaimers, reduced-motion behavior, keyboard focus, screen-reader labels, and serious/critical automated accessibility coverage

## Preserved foundation surfaces

### Public landing page

The landing page communicates the method, contrasts volume practice with mistake correction, explains student and tutor value, covers the three Reading task families, states trust boundaries, and routes into both demos.

### Shared demo shell

- Responsive desktop sidebar and mobile bottom navigation
- Demo Mode indicator and demo-only role switching
- Student and tutor views backed by the same local workspace state

## Phase 6 authenticated workspace

### Account and membership model

- Email/password signup plus an existing-account magic-link option use Supabase Auth’s PKCE-compatible cookie flow.
- Server and Proxy checks verify identity with `getClaims()`; authorization is repeated in the data/mutation layer.
- A newly verified account makes one permanent role choice. Tutor profiles can create a workspace; student profiles require a valid, unexpired, one-time class invitation.
- The stored profile role is immutable to the client. A student cannot create or promote a tutor role after account setup.
- Invitations store only a SHA-256 token hash. The raw token is displayed to the tutor once and redeemed transactionally by the invited student.
- Tutor/student visibility is based on an active `tutor_student_links` row inside the organization and class, not email domain, URL IDs, user metadata, or a client-submitted role.

### Authenticated learning workflow

- A tutor creates one organization and initial class, optionally copies only the original TraceTutor demo content, invites a student, and assigns a published item.
- Demo content copy never creates a fictional user, attempt, diagnosis, or history in the real workspace.
- A student completes the five onboarding preferences in their authenticated profile, sees only their assigned work, and submits answer, confidence, and evidence through one idempotent database command.
- The response command validates assignment ownership, option/evidence membership, identifiers, timing bounds, response shape, and duplicate submission IDs before writing attempts and response events.
- A tutor dashboard sees only attempts for explicitly linked students. High-confidence wrong is a transparent observed queue signal, not a psychological claim.
- Future answers, correct typed responses, distractor tags, and designated-evidence flags are not granted through the student-facing Data API columns.

### Data integrity and trust

- Content uses stable stimuli/items with immutable versions. A reviewed version must have exactly one correct choice and designated evidence before publication.
- Machine suggestions and tutor adjudications remain separate. Tutor adjudications and audit logs are append-only.
- Every public table has RLS enabled and at least one explicit policy. Sensitive writes are revoked from direct clients and exposed only through role-checking functions.
- TraceTutor still makes no official score claim, and every included practice item remains original independent material.

### Runtime selection

- With no public Supabase variables, TraceTutor starts in Demo Mode and requires no secret.
- With public Supabase variables, authenticated routes use Supabase unless the user explicitly enters the local demo. A short-lived HTTP-only cookie preserves that choice across demo role switching.
- Authenticated student, tutor, and auth responses are `private, no-store`; the service worker does not persist them. The local demo’s existing PWA behavior remains separate.

## Phase 7 optional diagnosis assistance

### Bounded model role

- The deterministic rule engine remains the first and sufficient diagnosis layer.
- A model request is eligible only when more than one rule candidate remains plausible or a short student explanation needs classification.
- The model never creates official score estimates, content keys, assignments, or final tutor decisions.
- Every model suggestion is labeled “AI suggestion — tutor review pending.” A tutor must adjudicate it before a matching cautious explanation can appear in the student weekly report.
- Model output never overwrites the original rule snapshot or the separate tutor adjudication.

### Minimum server-only data

The request contains task family and skill, the reviewed selected-option relation, short selected/designated evidence excerpts, evidence overlap, reported confidence, a timing bucket, an answer-change bucket, a structured probe response, a bounded aggregate recurrence/retention signal, and up to three rule candidates. It excludes student/tutor names, email, class roster, raw account identifiers, full unrelated history, and secrets. Student text is treated as untrusted quoted data. Requests use the Responses API with strict Structured Outputs and `store: false`.

### Strict suggestion contract

The validated output contains a primary process stage and cause, confidence from 0–1, up to two secondary causes, distractor relation, brief evidence, alternatives, one next probe/remediation/abstention action, tutor-review reasons, and a short uncertainty-aware student explanation. Malformed or unavailable output is discarded in favor of deterministic rules.

### Safety, cost, and evaluation

- Live AI requires both a server-only key and `TRACETUTOR_LIVE_AI_ENABLED=true`; the flag defaults to false.
- Per-user and per-organization limits, an eight-second timeout, one bounded retry, idempotent request handling, and a circuit breaker reduce failure and cost exposure.
- Redacted events contain status, model, latency, token counts, and error category only—never prompt bodies or keys.
- Versioned pricing metadata supports request and organization token/cost counters; unknown model pricing reports cost as unavailable instead of guessing.
- A six-case de-identified fixture set covers schema validity, tutor-gold agreement, rule/model contradictions, confidence buckets, abstention/review behavior, prompt injection, and API absence/failure. Normal tests never make a live API request.
- The tutor review includes a versioned mock fixture so the complete local sales demo remains inspectable without a key or network.

## Trust and trademark boundary

TraceTutor is independent practice software and is not endorsed by or affiliated with ETS. TOEFL is a registered trademark of ETS. Tutor verification refers to the intended workflow in which a tutor reviews mistake patterns and evidence traces; it does not imply ETS verification. Practice feedback, progress indicators, goals, and future product signals are not official TOEFL scores or score predictions.

## Out of scope after Phase 7

- AI-generated practice content or autonomous diagnosis
- PDF file generation; the lesson brief uses the browser print workflow
- Payments, subscriptions, or deployment
- Official score estimation
- Push notifications or manipulative engagement loops
- Service-role browser access, automatic fake-history migration, and claims of multi-device offline sync
- Production SMTP, custom domains, monitoring, backups, and deployment configuration
- Paid live model evaluation without separate human approval

## Phase 8 preview release

- TraceTutor may be shared through one Vercel Preview deployment for staging review only.
- The staging release defaults to the complete, visibly labeled browser-local Demo Mode and requires no database or AI secret.
- Student and tutor demo entry, mission persistence, tutor review, PWA behavior, trust copy, and mobile layout must be smoke-tested on the actual preview URL.
- A disabled Supabase connection means account creation and connected RLS lifecycle checks remain documented limitations, not simulated production behavior.
- The preview must not be promoted to Production, attached to a purchased/custom domain, or described as a production service.
- Rollback is non-destructive: deploy the previous verified commit as another immutable Preview and stop sharing the failing URL.

## Phase 9 personalized learning modes

The minimum viable study day is a personalized Daily Core of about ten active minutes; it is never the maximum a learner may study. Daily Rhythm suggests 10–30 minute defaults, while Deep Focus suggests 45–120 minute structured sessions. Both are editable preferences, and both expose every short, long, topic, review, and timed option.

Daily Core selection is deterministic: due D2/D7 reviews, high-confidence wrong answers, unresolved/recurring patterns, the learner’s Reading priority, balanced task coverage, then new original material. All required Core entries must be submitted before `daily_core_completed` and learner-local streak eligibility are recorded. Login, an open tab, and elapsed time alone never earn credit.

Long study plans preserve the Core first and then allocate distinct reviewed items into Complete the Words, Daily Life, Academic, correction, transfer, timed, break, and summary blocks. Ordinary unseen items do not repeat within seven days unless the item is an explicit review/retention check. A short reviewed pool produces a shorter honest plan and tutor warning, never duplicate filler.

Active study time counts only while the session is active, the page is visible, and interaction occurred within 90 seconds. The browser batches 15-second heartbeats. Paused, completed, hidden, and idle periods do not count. Daily and session records retain the goal at the time so a later plan change does not rewrite history.

Progress reports current/longest streak, today/week active time, active days, question and task coverage, supported accuracy trends, evidence accuracy, confidence calibration, high-confidence wrong rate, review completion, immediate/D2/D7 retention, VECR-7, recurring/corrected patterns, study history, and target context. Every unsupported metric says what must happen before it becomes available. No practice level or progress metric is an official TOEFL score.

Tutors may read engagement summaries only for explicitly linked learners. They may recommend weekly minutes, a Reading priority, or a Focused/Deep session, but the learner must visibly accept the recommendation. Tutors cannot read the private plan row or silently change the learner’s style.

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getPracticeItem, getReadingStimulus } from "@/data/practice-content";
import { getDiagnosticProbe } from "@/data/diagnostic-probes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStudentDemo } from "@/components/student/student-demo-provider";
import type {
  AnswerConfidence,
  AnswerDraft,
  MissionItemRef,
  PracticeItem,
  ResultState,
  StudyAttempt,
  StudyMission,
} from "@/domain/study";
import {
  distractorRelationLabels,
  errorCauseLabels,
  type DiagnosisRecord,
  type ProbeResponse,
  type RetentionSchedule,
} from "@/domain/mistake-intelligence";
import { isDraftReady } from "@/services/answer-evaluation";
import { cn } from "@/lib/cn";

const partNames = {
  review: "Due review",
  speed: "Speed Lane",
  thinking: "Thinking Lane",
  transfer: "Transfer check",
} as const;

const resultCopy: Record<
  ResultState,
  { title: string; description: string; tone: "mint" | "violet" | "coral" }
> = {
  secure: {
    title: "Secure",
    description: "Correct, supported, and confident enough to move forward.",
    tone: "mint",
  },
  unstable: {
    title: "Unstable",
    description:
      "Correct, but the confidence or evidence trace needs another return.",
    tone: "violet",
  },
  diagnose: {
    title: "Diagnose",
    description:
      "Incorrect. Pause for a short check before carrying the correction on.",
    tone: "coral",
  },
};

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export function PracticeExperience({ missionId }: { missionId: string }) {
  const {
    hydrated,
    state,
    startMission,
    saveDraft,
    submitEntry,
    completeProbe,
    advanceMission,
    saveElapsedSeconds,
  } = useStudentDemo();
  const router = useRouter();
  const mission = state?.activeMission;
  const activeMissionId = mission?.id;
  const missionStartedAt = mission?.startedAt;
  const missionCompletedAt = mission?.completedAt;
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionSecondsRef = useRef(0);

  useEffect(() => {
    if (activeMissionId === missionId && !missionStartedAt) {
      void startMission(missionId);
    }
  }, [activeMissionId, missionId, missionStartedAt, startMission]);

  useEffect(() => {
    if (activeMissionId !== missionId || missionCompletedAt) {
      return;
    }
    const interval = window.setInterval(() => {
      setSessionSeconds((seconds) => {
        sessionSecondsRef.current = seconds + 1;
        return seconds + 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activeMissionId, missionCompletedAt, missionId]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.ready.then(() => {
      navigator.serviceWorker.controller?.postMessage({
        type: "CACHE_URL",
        url: window.location.href,
      });
    });
  }, [missionId]);

  if (!hydrated || !state?.studyPlan) {
    return null;
  }

  if (!mission || mission.id !== missionId) {
    return (
      <Card className="mx-auto max-w-xl text-center sm:p-10">
        <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
          Mission unavailable
        </p>
        <h1 className="mt-4 font-editorial text-4xl">
          Return to Today to continue.
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          This link does not match the currently saved local sprint.
        </p>
        <Button href="/student/today" className="mt-7">
          Open Today
        </Button>
      </Card>
    );
  }

  const viewIndex = reviewIndex ?? mission.currentIndex;
  const entry = mission.items[viewIndex];
  if (!entry) {
    return null;
  }
  const item = getPracticeItem(entry.itemId);
  if (!item) {
    return null;
  }
  const attemptId = mission.attemptIdsByEntry[entry.entryId];
  const attempt = attemptId
    ? state.attempts.find((candidate) => candidate.id === attemptId)
    : undefined;
  const attemptDiagnosis = attempt?.diagnosisId
    ? state.diagnoses.find((diagnosis) => diagnosis.id === attempt.diagnosisId)
    : undefined;
  const sourceDiagnosis = entry.sourceDiagnosisId
    ? state.diagnoses.find(
        (diagnosis) => diagnosis.id === entry.sourceDiagnosisId,
      )
    : undefined;
  const displayDiagnosis = attemptDiagnosis ?? sourceDiagnosis;
  const probeResponse = displayDiagnosis?.probeResponseId
    ? state.probeResponses.find(
        (response) => response.id === displayDiagnosis.probeResponseId,
      )
    : undefined;
  const retentionSchedules = displayDiagnosis
    ? state.retentionSchedules.filter(
        (schedule) => schedule.diagnosisId === displayDiagnosis.id,
      )
    : [];
  const probePending = Boolean(
    attemptDiagnosis?.recommendedProbeCode && !attemptDiagnosis.probeResponseId,
  );
  const completedCount = Object.keys(mission.attemptIdsByEntry).length;

  async function handleNext() {
    if (!mission) {
      return;
    }
    if (viewIndex < mission.currentIndex) {
      const nextIndex = viewIndex + 1;
      setReviewIndex(nextIndex === mission.currentIndex ? null : nextIndex);
      return;
    }
    const totalSeconds = mission.elapsedSeconds + sessionSecondsRef.current;
    await saveElapsedSeconds(missionId, totalSeconds);
    sessionSecondsRef.current = 0;
    setSessionSeconds(0);
    if (mission.sessionId) {
      const session = state.studySessions.find(
        (candidate) => candidate.id === mission.sessionId,
      );
      const block = session?.blocks.find((candidate) =>
        candidate.missionEntryIds.includes(entry.entryId),
      );
      if (block?.status === "completed") {
        router.push(`/student/study/${mission.sessionId}`);
        return;
      }
    }
    const nextState = await advanceMission(missionId);
    if (nextState?.activeMission?.completedAt) {
      router.push(
        nextState.activeMission.sessionId
          ? `/student/study/${nextState.activeMission.sessionId}`
          : "/student/today",
      );
    }
  }

  return (
    <div>
      <header className="rounded-[1.75rem] border border-ink/10 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge tone={entry.part === "speed" ? "coral" : "violet"}>
              {partNames[entry.part]}
            </Badge>
            {entry.reviewCadence ? (
              <Badge tone="neutral">
                {entry.reviewCadence === "D2" ? "2-day review" : "7-day review"}
              </Badge>
            ) : null}
            {mission.mode === "weekly-boss" ? (
              <Badge tone="coral">The Half-Truth Hydra</Badge>
            ) : mission.mode === "light" ? (
              <Badge tone="mint">Light Day</Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-ink-muted">
            <span
              aria-label={`Timer ${formatTimer(
                mission.elapsedSeconds + sessionSeconds,
              )}`}
            >
              {formatTimer(mission.elapsedSeconds + sessionSeconds)}
            </span>
            <span>Saved locally</span>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <Progress
            className="flex-1"
            value={(completedCount / mission.items.length) * 100}
            label="Correction sprint progress"
            tone="violet"
          />
          <span className="shrink-0 text-xs font-bold text-ink-muted">
            {viewIndex + 1} of {mission.items.length}
          </span>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <PracticeItemPanel
          key={entry.entryId}
          mission={mission}
          entry={entry}
          item={item}
          attempt={attempt}
          diagnosis={displayDiagnosis}
          probeResponse={probeResponse}
          retentionSchedules={retentionSchedules}
          onSave={(patch) => saveDraft(mission.id, entry.entryId, patch)}
          onSubmit={() =>
            submitEntry(
              mission.id,
              entry.entryId,
              mission.elapsedSeconds + sessionSecondsRef.current,
            )
          }
          onCompleteProbe={(diagnosisId, selectedOptionId) =>
            completeProbe(diagnosisId, selectedOptionId)
          }
        />

        <aside className="space-y-4" aria-label="Practice guidance">
          <Card tone="violet">
            <p className="text-xs font-bold tracking-wide text-violet uppercase">
              Today’s trace
            </p>
            <p className="mt-3 font-editorial text-2xl">
              {mission.primaryTargetLabel}
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              Use the text signal before trusting what merely sounds plausible.
            </p>
          </Card>
          {entry.selectionReason ? (
            <Card tone="mint">
              <p className="text-xs font-bold tracking-wide text-mint-deep uppercase">
                Why this item
              </p>
              <p className="mt-3 text-xs leading-5 text-ink-muted">
                {entry.selectionReason}
              </p>
              {mission.mode === "weekly-boss" ? (
                <p className="mt-3 text-xs leading-5 font-bold text-ink">
                  Boss completion alone cannot resolve a pattern.
                </p>
              ) : null}
            </Card>
          ) : null}
          <Card>
            <p className="text-xs font-bold tracking-wide text-coral-deep uppercase">
              Content status
            </p>
            <p className="mt-3 text-xs leading-5 font-bold text-ink">
              Original practice content — not official ETS material.
            </p>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              TraceTutor is independent and not endorsed by ETS.
            </p>
          </Card>
        </aside>
      </div>

      <footer className="sticky bottom-3 z-10 mt-6 flex items-center justify-between gap-3 rounded-full border border-ink/10 bg-paper/95 p-2 shadow-[0_12px_40px_rgba(37,33,31,0.14)] backdrop-blur-xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setReviewIndex(Math.max(0, viewIndex - 1))}
          disabled={viewIndex === 0}
        >
          <span aria-hidden="true">←</span> Previous
        </Button>
        <p className="hidden text-xs font-semibold text-ink-muted sm:block">
          Submitted answers are locked; previous items stay reviewable.
        </p>
        <Button
          size="sm"
          onClick={() => void handleNext()}
          disabled={!attempt || probePending}
        >
          {probePending ? (
            "Complete probe"
          ) : (
            <>
              {viewIndex === mission.items.length - 1 ? "Finish" : "Next"}
              <span aria-hidden="true">→</span>
            </>
          )}
        </Button>
      </footer>
    </div>
  );
}

function PracticeItemPanel({
  mission,
  entry,
  item,
  attempt,
  diagnosis,
  probeResponse,
  retentionSchedules,
  onSave,
  onSubmit,
  onCompleteProbe,
}: {
  mission: StudyMission;
  entry: MissionItemRef;
  item: PracticeItem;
  attempt?: StudyAttempt;
  diagnosis?: DiagnosisRecord;
  probeResponse?: ProbeResponse;
  retentionSchedules: RetentionSchedule[];
  onSave(patch: Partial<AnswerDraft>): Promise<void>;
  onSubmit(): Promise<void>;
  onCompleteProbe(diagnosisId: string, selectedOptionId: string): Promise<void>;
}) {
  const savedDraft = mission.drafts[entry.entryId];
  const [draft, setDraft] = useState<AnswerDraft>(
    savedDraft ?? { evidenceSegmentIds: [], savedAt: mission.lastSavedAt },
  );
  const [submitting, setSubmitting] = useState(false);
  const stimulus =
    item.kind === "reading-question"
      ? getReadingStimulus(item.stimulusId)
      : null;
  const ready = isDraftReady(item, draft);

  function updateDraft(patch: Partial<AnswerDraft>) {
    const next = { ...draft, ...patch, savedAt: mission.lastSavedAt };
    setDraft(next);
    void onSave(patch);
  }

  async function handleSubmit() {
    setSubmitting(true);
    await onSubmit();
    setSubmitting(false);
  }

  return (
    <article>
      <Card className="p-0">
        <div className="border-b border-ink/10 bg-cream/55 p-5 sm:p-8">
          <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
            {item.title}
          </p>
          <h1 className="mt-3 font-editorial text-3xl leading-tight tracking-tight sm:text-4xl">
            {item.kind === "complete-words"
              ? "Complete the missing word ending."
              : item.prompt}
          </h1>
        </div>

        <div className="p-5 sm:p-8">
          {item.kind === "complete-words" ? (
            <CompleteWordsPrompt
              item={item}
              value={draft.typedAnswer ?? ""}
              disabled={Boolean(attempt)}
              onChange={(value) => updateDraft({ typedAnswer: value })}
            />
          ) : null}

          {item.kind === "transfer" ? (
            <div>
              <div className="rounded-2xl border-l-4 border-violet bg-violet-soft p-5 text-sm leading-7 text-ink-muted">
                {item.microContext}
              </div>
              <ChoiceOptions
                name={`${entry.entryId}-answer`}
                options={item.options}
                selected={draft.selectedOptionId}
                disabled={Boolean(attempt)}
                onChange={(selectedOptionId) => {
                  const answerChanges =
                    draft.selectedOptionId &&
                    draft.selectedOptionId !== selectedOptionId
                      ? (draft.answerChanges ?? 0) + 1
                      : (draft.answerChanges ?? 0);
                  updateDraft({ selectedOptionId, answerChanges });
                }}
              />
            </div>
          ) : null}

          {item.kind === "reading-question" && stimulus ? (
            <ReadingQuestionPrompt
              item={item}
              stimulus={stimulus}
              draft={draft}
              disabled={Boolean(attempt)}
              onChange={updateDraft}
            />
          ) : null}

          {attempt ? (
            <ResultFeedback
              attempt={attempt}
              item={item}
              diagnosis={diagnosis}
              probeResponse={probeResponse}
              retentionSchedules={retentionSchedules}
              onCompleteProbe={onCompleteProbe}
            />
          ) : null}

          {!attempt ? (
            <div className="mt-8 border-t border-ink/10 pt-6">
              <Button
                className="w-full sm:w-auto"
                onClick={() => void handleSubmit()}
                disabled={!ready || submitting}
              >
                {submitting ? "Checking…" : "Submit this item"}
              </Button>
              {!ready ? (
                <p
                  className="mt-3 text-xs leading-5 text-ink-muted"
                  role="status"
                >
                  {item.kind === "reading-question"
                    ? "Choose an answer, confidence, and evidence before submitting."
                    : "Complete the response before submitting."}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>
    </article>
  );
}

function CompleteWordsPrompt({
  item,
  value,
  disabled,
  onChange,
}: {
  item: Extract<PracticeItem, { kind: "complete-words" }>;
  value: string;
  disabled: boolean;
  onChange(value: string): void;
}) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.12em] text-coral-deep uppercase">
        Complete the Words
      </p>
      <div className="paper-rule mt-4 rounded-[1.5rem] border border-ink/10 bg-paper p-5 font-editorial text-xl leading-[2.15] sm:p-7 sm:text-2xl">
        {item.paragraphBefore}
        <span className="inline-flex items-baseline rounded-xl bg-coral-soft px-2 whitespace-nowrap">
          <span className="font-bold">{item.wordPrefix}</span>
          <label className="sr-only" htmlFor={`${item.id}-ending`}>
            Missing ending for {item.wordPrefix}
          </label>
          <input
            id={`${item.id}-ending`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            autoComplete="off"
            spellCheck={false}
            className="ml-0.5 w-20 border-b-2 border-coral-deep bg-transparent px-1 font-sans text-base font-bold outline-none focus:border-violet disabled:opacity-80"
            aria-describedby={`${item.id}-hint`}
          />
        </span>
        {item.paragraphAfter}
      </div>
      <p
        id={`${item.id}-hint`}
        className="mt-3 text-xs leading-5 text-ink-muted"
      >
        Type the missing ending or the complete word. Capitalization and extra
        spaces do not affect the check.
      </p>
    </div>
  );
}

function ChoiceOptions({
  name,
  options,
  selected,
  disabled,
  onChange,
}: {
  name: string;
  options: Array<{ id: string; label: string }>;
  selected?: string;
  disabled: boolean;
  onChange(id: string): void;
}) {
  return (
    <fieldset className="mt-6" disabled={disabled}>
      <legend className="text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
        1. Choose an answer
      </legend>
      <div className="mt-3 grid gap-2">
        {options.map((option, index) => (
          <label
            key={option.id}
            className={cn(
              "flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet",
              selected === option.id
                ? "border-violet bg-violet-soft"
                : "border-ink/10 bg-white hover:border-ink/25",
              disabled && "cursor-default",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={selected === option.id}
              onChange={() => onChange(option.id)}
              className="size-4 accent-violet"
            />
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink/5 text-xs font-bold">
              {String.fromCharCode(65 + index)}
            </span>
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ReadingQuestionPrompt({
  item,
  stimulus,
  draft,
  disabled,
  onChange,
}: {
  item: Extract<PracticeItem, { kind: "reading-question" }>;
  stimulus: NonNullable<ReturnType<typeof getReadingStimulus>>;
  draft: AnswerDraft;
  disabled: boolean;
  onChange(patch: Partial<AnswerDraft>): void;
}) {
  function toggleEvidence(segmentId: string) {
    const selected = draft.evidenceSegmentIds.includes(segmentId);
    onChange({
      evidenceSegmentIds: selected
        ? draft.evidenceSegmentIds.filter((id) => id !== segmentId)
        : [...draft.evidenceSegmentIds, segmentId],
    });
  }

  return (
    <div>
      <section
        className="rounded-[1.5rem] border border-ink/10 bg-paper p-5 sm:p-7"
        aria-labelledby={`${stimulus.id}-title`}
      >
        <p className="text-xs font-bold tracking-[0.12em] text-violet uppercase">
          {stimulus.eyebrow}
        </p>
        <h2
          id={`${stimulus.id}-title`}
          className="mt-2 font-editorial text-3xl"
        >
          {stimulus.title}
        </h2>
        <p className="mt-2 text-xs leading-5 text-ink-muted">
          {stimulus.context}
        </p>
        <div className="mt-6 space-y-2">
          {stimulus.segments.map((segment, index) => (
            <p key={segment.id} className="font-editorial text-lg leading-8">
              <span
                className="mr-2 text-xs font-bold text-ink-muted"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              {segment.text}
            </p>
          ))}
        </div>
      </section>

      <ChoiceOptions
        name={`${item.id}-answer`}
        options={item.options}
        selected={draft.selectedOptionId}
        disabled={disabled}
        onChange={(selectedOptionId) => {
          const answerChanges =
            draft.selectedOptionId &&
            draft.selectedOptionId !== selectedOptionId
              ? (draft.answerChanges ?? 0) + 1
              : (draft.answerChanges ?? 0);
          onChange({ selectedOptionId, answerChanges });
        }}
      />

      <fieldset className="mt-7" disabled={disabled || !draft.selectedOptionId}>
        <legend className="text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
          2. Select confidence
        </legend>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(
            [
              ["guessing", "Guessing"],
              ["think-so", "Think so"],
              ["certain", "Certain"],
            ] as Array<[AnswerConfidence, string]>
          ).map(([value, label]) => (
            <label
              key={value}
              className={cn(
                "grid min-h-12 cursor-pointer place-items-center rounded-xl border px-2 text-center text-xs font-bold transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet",
                draft.confidence === value
                  ? "border-violet bg-violet text-white"
                  : "border-ink/10 bg-white",
                !draft.selectedOptionId && "cursor-not-allowed opacity-45",
              )}
            >
              <input
                type="radio"
                name={`${item.id}-confidence`}
                value={value}
                checked={draft.confidence === value}
                onChange={() => onChange({ confidence: value })}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-7" disabled={disabled || !draft.confidence}>
        <legend className="text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
          3. Select the sentence or segment used as evidence
        </legend>
        <div className="mt-3 space-y-2">
          {stimulus.segments.map((segment, index) => {
            const selected = draft.evidenceSegmentIds.includes(segment.id);
            return (
              <button
                key={segment.id}
                type="button"
                disabled={disabled || !draft.confidence}
                onClick={() => toggleEvidence(segment.id)}
                aria-pressed={selected}
                aria-label={`Evidence segment ${index + 1}: ${segment.text}`}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left text-sm leading-6 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
                  selected
                    ? "border-violet bg-violet-soft text-ink shadow-[inset_4px_0_0_var(--color-violet)]"
                    : "border-ink/10 bg-white text-ink-muted hover:border-ink/25",
                  !draft.confidence && "cursor-not-allowed opacity-45",
                )}
              >
                <span className="mr-2 font-bold text-violet">{index + 1}</span>
                {segment.text}
                {selected ? (
                  <span className="ml-2 font-bold text-violet">Selected</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

function ResultFeedback({
  attempt,
  item,
  diagnosis,
  probeResponse,
  retentionSchedules,
  onCompleteProbe,
}: {
  attempt: StudyAttempt;
  item: PracticeItem;
  diagnosis?: DiagnosisRecord;
  probeResponse?: ProbeResponse;
  retentionSchedules: RetentionSchedule[];
  onCompleteProbe(diagnosisId: string, selectedOptionId: string): Promise<void>;
}) {
  const copy = resultCopy[attempt.result];
  const probe = diagnosis?.recommendedProbeCode
    ? getDiagnosticProbe(diagnosis.recommendedProbeCode)
    : null;
  const probePending = Boolean(probe && !probeResponse);
  return (
    <section
      className={cn(
        "mt-8 rounded-[1.5rem] border p-5 sm:p-6",
        copy.tone === "mint" && "border-mint-deep/15 bg-mint",
        copy.tone === "violet" && "border-violet/20 bg-violet-soft",
        copy.tone === "coral" && "border-coral/25 bg-coral-soft",
      )}
      aria-live="polite"
      aria-labelledby={`${attempt.id}-result`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id={`${attempt.id}-result`}
          className="font-editorial text-3xl font-bold"
        >
          {copy.title}
        </h2>
        <Badge tone={copy.tone}>
          {attempt.correct ? "Correct" : "Correction needed"}
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink-muted">
        {copy.description}
      </p>
      <p className="mt-3 text-sm leading-6 font-semibold text-ink">
        {item.explanation}
      </p>

      {diagnosis ? (
        <div className="mt-6 border-t border-ink/10 pt-6">
          {item.kind === "transfer" ? (
            <div className="rounded-xl border border-violet/15 bg-white/65 px-4 py-3">
              <h3 className="text-xs font-bold tracking-[0.13em] text-violet uppercase">
                Source correction
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                This fresh item checked the likely pattern from the original
                miss. The diagnostic trace below belongs to that source
                diagnosis, not this secure transfer answer.
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-xs font-bold tracking-[0.13em] text-violet uppercase">
                Observed facts
              </h3>
              <ul className="mt-3 space-y-2">
                {diagnosis.observations.map((observation) => (
                  <li
                    key={observation.code}
                    className="rounded-xl bg-white/65 px-4 py-3 text-sm leading-6"
                  >
                    <strong>{observation.label}.</strong>{" "}
                    <span className="text-ink-muted">{observation.detail}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {probePending && probe ? (
            <DiagnosticProbePanel
              diagnosisId={diagnosis.id}
              probe={probe}
              onComplete={onCompleteProbe}
            />
          ) : (
            <DiagnosisSummary
              diagnosis={diagnosis}
              probeResponse={probeResponse}
              schedules={retentionSchedules}
              transferResult={item.kind === "transfer" ? attempt.result : null}
            />
          )}
        </div>
      ) : attempt.result === "diagnose" ? (
        <p className="mt-5 border-t border-coral/20 pt-4 text-sm leading-6 text-ink-muted">
          This result is recorded without claiming certainty about the student’s
          hidden reasoning.
        </p>
      ) : null}
    </section>
  );
}

function DiagnosticProbePanel({
  diagnosisId,
  probe,
  onComplete,
}: {
  diagnosisId: string;
  probe: NonNullable<ReturnType<typeof getDiagnosticProbe>>;
  onComplete(diagnosisId: string, selectedOptionId: string): Promise<void>;
}) {
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitProbe() {
    if (!selectedOptionId) return;
    setSubmitting(true);
    await onComplete(diagnosisId, selectedOptionId);
    setSubmitting(false);
  }

  return (
    <section
      className="mt-6 rounded-2xl border border-violet/20 bg-violet-soft p-4 sm:p-5"
      aria-labelledby={`${diagnosisId}-probe-title`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold tracking-[0.13em] text-violet uppercase">
          30-second diagnostic probe
        </p>
        <Badge tone="violet">≈ {probe.estimatedSeconds} sec</Badge>
      </div>
      <h3
        id={`${diagnosisId}-probe-title`}
        className="mt-3 font-editorial text-2xl"
      >
        {probe.title}
      </h3>
      <p className="mt-2 text-sm font-semibold">{probe.prompt}</p>
      <blockquote className="mt-4 rounded-xl border-l-4 border-violet bg-white/75 p-4 text-sm leading-6 text-ink-muted">
        {probe.sourceText}
      </blockquote>
      <fieldset className="mt-4">
        <legend className="sr-only">Choose the diagnostic probe answer</legend>
        <div className="grid gap-2">
          {probe.options.map((option) => (
            <label
              key={option.id}
              className={cn(
                "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet",
                selectedOptionId === option.id
                  ? "border-violet shadow-[inset_4px_0_0_var(--color-violet)]"
                  : "border-ink/10",
              )}
            >
              <input
                type="radio"
                name={`${diagnosisId}-probe`}
                value={option.id}
                checked={selectedOptionId === option.id}
                onChange={() => setSelectedOptionId(option.id)}
                className="size-4 accent-violet"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <Button
        className="mt-4 w-full sm:w-auto"
        variant="violet"
        onClick={() => void submitProbe()}
        disabled={!selectedOptionId || submitting}
      >
        {submitting ? "Updating…" : "Update the diagnosis"}
      </Button>
      <p className="mt-3 text-xs leading-5 text-ink-muted">
        This probe distinguishes observable rule patterns; it does not read or
        infer private thoughts.
      </p>
    </section>
  );
}

function DiagnosisSummary({
  diagnosis,
  probeResponse,
  schedules,
  transferResult,
}: {
  diagnosis: DiagnosisRecord;
  probeResponse?: ProbeResponse;
  schedules: RetentionSchedule[];
  transferResult: ResultState | null;
}) {
  return (
    <div className="mt-6 space-y-5">
      <section className="rounded-2xl border border-violet/20 bg-white/75 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold tracking-[0.13em] text-violet uppercase">
            Likely diagnosis
          </h3>
          <Badge tone={diagnosis.tutorReviewRequired ? "coral" : "violet"}>
            {diagnosis.tutorReviewRequired
              ? "Tutor review requested"
              : `${Math.round(diagnosis.confidence * 100)}% rule confidence`}
          </Badge>
        </div>
        <p className="mt-3 font-editorial text-3xl">
          {diagnosis.primaryHypothesis
            ? `Likely: ${errorCauseLabels[diagnosis.primaryHypothesis]}`
            : "No causal label assigned"}
        </p>
        <p className="mt-2 text-xs leading-5 text-ink-muted">
          This is a reviewable rule-based hypothesis, not certainty about a
          hidden mental state.
        </p>
        {probeResponse ? (
          <p className="mt-4 rounded-xl bg-violet-soft px-4 py-3 text-sm leading-6">
            <strong>Probe update:</strong>{" "}
            {probeResponse.correct
              ? "The contrast was recognized on the probe, so hypothesis confidence was reduced slightly."
              : "The same contrast remained difficult on the probe, so hypothesis confidence increased."}
          </p>
        ) : null}
        {diagnosis.distractorRelation ? (
          <div className="mt-4">
            <p className="text-xs font-bold tracking-wide text-coral-deep uppercase">
              Distractor trap
            </p>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              {distractorRelationLabels[diagnosis.distractorRelation]}. The
              option’s relationship to the source—not just its vocabulary—made
              it unsafe.
            </p>
          </div>
        ) : null}
        <div className="mt-4">
          <p className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            Supporting trace
          </p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink-muted">
            {diagnosis.supportingEvidence.map((evidence) => (
              <li key={evidence}>• {evidence}</li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-sm font-semibold">
          Next target: {diagnosis.nextRemediationTarget.label}
        </p>
      </section>

      {schedules.length > 0 ? (
        <section aria-labelledby={`${diagnosis.id}-schedule-title`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              id={`${diagnosis.id}-schedule-title`}
              className="font-editorial text-2xl"
            >
              Correction schedule
            </h3>
            {transferResult ? (
              <Badge tone={transferResult === "secure" ? "mint" : "coral"}>
                Transfer {transferResult}
              </Badge>
            ) : (
              <Badge tone="violet">Immediate transfer next</Badge>
            )}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="rounded-xl border border-ink/10 bg-white/70 p-3"
              >
                <p className="text-xs font-bold tracking-wide text-ink-muted uppercase">
                  {schedule.cadence === "immediate"
                    ? "Immediate"
                    : `Day ${schedule.cadence.slice(1)}`}
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {schedule.outcome === "scheduled"
                    ? schedule.dueDate
                    : schedule.outcome === "secure"
                      ? "Secure"
                      : "Needs another correction"}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

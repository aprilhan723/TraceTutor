"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getPracticeItem, getReadingStimulus } from "@/data/practice-content";
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

  if (!hydrated || !state?.onboarding) {
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
    const nextState = await advanceMission(missionId);
    if (nextState?.activeMission?.completedAt) {
      router.push("/student/today");
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
              <Badge tone="neutral">{entry.reviewCadence} return</Badge>
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
          onSave={(patch) => saveDraft(mission.id, entry.entryId, patch)}
          onSubmit={() => submitEntry(mission.id, entry.entryId)}
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
        <Button size="sm" onClick={() => void handleNext()} disabled={!attempt}>
          {viewIndex === mission.items.length - 1 ? "Finish" : "Next"}
          <span aria-hidden="true">→</span>
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
  onSave,
  onSubmit,
}: {
  mission: StudyMission;
  entry: MissionItemRef;
  item: PracticeItem;
  attempt?: StudyAttempt;
  onSave(patch: Partial<AnswerDraft>): Promise<void>;
  onSubmit(): Promise<void>;
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
                onChange={(selectedOptionId) =>
                  updateDraft({ selectedOptionId })
                }
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

          {attempt ? <ResultFeedback attempt={attempt} item={item} /> : null}

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
        onChange={(selectedOptionId) => onChange({ selectedOptionId })}
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
}: {
  attempt: StudyAttempt;
  item: PracticeItem;
}) {
  const copy = resultCopy[attempt.result];
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
      {attempt.result === "diagnose" ? (
        <div className="mt-5 border-t border-coral/20 pt-4">
          <p className="text-xs font-bold tracking-wide text-coral-deep uppercase">
            Short diagnostic check
          </p>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Before Next, name the gap: word form, exact evidence, or a
            conclusion that went beyond the text. TraceTutor records the miss
            without pretending to know your thought process.
          </p>
        </div>
      ) : null}
    </section>
  );
}

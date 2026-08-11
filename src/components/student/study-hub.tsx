"use client";

import { useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useStudentDemo } from "@/components/student/student-demo-provider";
import type {
  LearnerStudyPlan,
  StudentStudyState,
  StudyTopic,
} from "@/domain/study";
import { cn } from "@/lib/cn";
import { differenceInDays } from "@/lib/clock";

const durations = [15, 30, 60, 90, 120] as const;
const topics: Array<{ value: StudyTopic; label: string; detail: string }> = [
  {
    value: "adaptive-mix",
    label: "Adaptive mix",
    detail: "Reviews, current patterns, and balanced format coverage.",
  },
  {
    value: "complete-words",
    label: "Complete the Words",
    detail: "Grammar, word form, and context signals.",
  },
  {
    value: "daily-life",
    label: "Daily Life",
    detail: "Purpose, detail, and practical evidence.",
  },
  {
    value: "academic",
    label: "Academic",
    detail: "Claims, inference limits, and passage evidence.",
  },
  {
    value: "mistake-review",
    label: "Mistake review",
    detail: "Unresolved diagnoses and corrective transfer.",
  },
  {
    value: "due-reviews",
    label: "Due reviews",
    detail: "Prioritize scheduled D2 and D7 work.",
  },
  {
    value: "timed-mixed",
    label: "Timed mixed",
    detail: "Controlled pacing with evidence steps preserved.",
  },
];

export function StudyHub() {
  const {
    hydrated,
    state,
    dueReviewCount,
    programDateKey,
    startPersonalizedSession,
  } = useStudentDemo();
  if (!hydrated || !state?.studyPlan || !programDateKey)
    return (
      <Card
        className="h-72 animate-pulse motion-reduce:animate-none"
        aria-label="Loading study plan"
      />
    );
  return (
    <ReadyStudyHub
      state={state}
      plan={state.studyPlan}
      dueReviewCount={dueReviewCount}
      programDateKey={programDateKey}
      startPersonalizedSession={startPersonalizedSession}
    />
  );
}

function ReadyStudyHub({
  state,
  plan,
  dueReviewCount,
  programDateKey,
  startPersonalizedSession,
}: {
  state: StudentStudyState;
  plan: LearnerStudyPlan;
  dueReviewCount: number;
  programDateKey: string;
  startPersonalizedSession(options: {
    minutes: number;
    topic: StudyTopic;
    includeDueReviews: boolean;
    timed: boolean;
  }): Promise<StudentStudyState | null>;
}) {
  const router = useRouter();
  const preferred = plan.defaultDailyMinutes;
  const usesPreset = durations.includes(
    preferred as (typeof durations)[number],
  );
  const [minutes, setMinutes] = useState(
    usesPreset ? (preferred as (typeof durations)[number]) : 30,
  );
  const [customMinutes, setCustomMinutes] = useState(preferred);
  const [custom, setCustom] = useState(!usesPreset);
  const [topic, setTopic] = useState<StudyTopic>(
    dueReviewCount > 0
      ? "due-reviews"
      : plan.readingPriority === "balanced"
        ? "adaptive-mix"
        : plan.readingPriority,
  );
  const [includeDueReviews, setIncludeDueReviews] = useState(true);
  const [timed, setTimed] = useState(
    Boolean(
      plan.targetTestDate &&
      differenceInDays(plan.targetTestDate, programDateKey) <= 21,
    ),
  );
  const [starting, setStarting] = useState(false);
  const activeSession = state.studySessions.find(
    (session) =>
      session.id === state.activeSessionId && session.status !== "completed",
  );
  const selectedMinutes = custom ? customMinutes : minutes;

  async function start() {
    setStarting(true);
    const next = await startPersonalizedSession({
      minutes: selectedMinutes,
      topic,
      includeDueReviews,
      timed: timed || topic === "timed-mixed",
    });
    const sessionId = next?.activeSessionId;
    if (sessionId) router.push(`/student/study/${sessionId}`);
    setStarting(false);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Personalized Study"
        title="Study as long as today allows."
        description="Daily Core always comes first. Longer plans add distinct reviewed items, deliberate breaks, and a saved stopping point."
      />
      {activeSession ? (
        <Card
          tone="mint"
          className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <Badge tone="mint">Session saved</Badge>
            <h2 className="mt-3 font-editorial text-3xl">
              Resume {activeSession.plannedMinutes}-minute plan
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              {activeSession.questionsAnswered} questions answered ·{" "}
              {Math.round(activeSession.activeSeconds / 60)} active minutes kept
            </p>
          </div>
          <Button href={`/student/study/${activeSession.id}` as Route}>
            Resume session <span aria-hidden="true">→</span>
          </Button>
        </Card>
      ) : null}
      <div className="mt-7 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <p className="text-xs font-bold tracking-[0.14em] text-coral-deep uppercase">
            1 · Choose time
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6 xl:grid-cols-3">
            {durations.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setCustom(false);
                  setMinutes(value);
                }}
                className={cn(
                  "min-h-14 rounded-2xl border text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral",
                  !custom && minutes === value
                    ? "border-coral bg-coral-soft text-coral-deep"
                    : "border-ink/10 bg-paper",
                )}
              >
                {value} min
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustom(true)}
              className={cn(
                "min-h-14 rounded-2xl border text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral",
                custom
                  ? "border-coral bg-coral-soft text-coral-deep"
                  : "border-ink/10 bg-paper",
              )}
            >
              Custom
            </button>
          </div>
          {custom ? (
            <label
              className="mt-5 block text-sm font-bold"
              htmlFor="custom-study-minutes"
            >
              Custom minutes: {customMinutes}
              <input
                id="custom-study-minutes"
                className="mt-3 w-full accent-coral"
                type="range"
                min="10"
                max="120"
                step="5"
                value={customMinutes}
                onChange={(event) =>
                  setCustomMinutes(Number(event.target.value))
                }
              />
            </label>
          ) : null}
          <div className="mt-6 rounded-2xl bg-cream p-4 text-sm leading-6 text-ink-muted">
            <strong className="text-ink">Daily Core stays ~10 minutes.</strong>{" "}
            A {selectedMinutes}-minute request adds only available,
            non-duplicate practice. If the reviewed pool is short, the plan ends
            early and says so.
          </div>
        </Card>
        <Card>
          <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
            2 · Aim the session
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {topics.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "cursor-pointer rounded-2xl border p-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet",
                  topic === option.value
                    ? "border-violet bg-violet-soft"
                    : "border-ink/10 bg-paper",
                )}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name="study-topic"
                  checked={topic === option.value}
                  onChange={() => setTopic(option.value)}
                />
                <span className="text-sm font-bold">{option.label}</span>
                <span className="mt-1 block text-xs leading-5 text-ink-muted">
                  {option.detail}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-ink/10 bg-paper px-4 text-sm font-bold">
              <input
                type="checkbox"
                checked={includeDueReviews}
                onChange={(event) => setIncludeDueReviews(event.target.checked)}
                className="size-4 accent-violet"
              />
              Include due reviews
            </label>
            <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-ink/10 bg-paper px-4 text-sm font-bold">
              <input
                type="checkbox"
                checked={timed}
                onChange={(event) => setTimed(event.target.checked)}
                className="size-4 accent-violet"
              />
              Timed practice
            </label>
          </div>
          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={() => void start()}
            disabled={starting}
          >
            {starting
              ? "Building your plan…"
              : `Build my ${selectedMinutes}-minute session`}
            <span aria-hidden="true">→</span>
          </Button>
        </Card>
      </div>
    </div>
  );
}

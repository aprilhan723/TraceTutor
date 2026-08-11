"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStudentDemo } from "@/components/student/student-demo-provider";
import {
  studyMinutePresets,
  type LearningStyle,
  type ReadingPriority,
} from "@/domain/study";
import { cn } from "@/lib/cn";
import { differenceInDays } from "@/lib/clock";

const scoreLevels = Array.from({ length: 11 }, (_, index) => 1 + index * 0.5);
const priorityOptions: Array<{ value: ReadingPriority; label: string }> = [
  { value: "balanced", label: "Balanced correction" },
  { value: "complete-words", label: "Complete the Words" },
  { value: "daily-life", label: "Read in Daily Life" },
  { value: "academic", label: "Academic passages" },
  { value: "mistake-review", label: "Mistake review" },
];

function browserTimezone() {
  if (typeof Intl === "undefined") return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function browserDateKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function OnboardingFlow() {
  const { completeStudyPlan, student } = useStudentDemo();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [learningStyle, setLearningStyle] =
    useState<LearningStyle>("daily-rhythm");
  const [currentLevel, setCurrentLevel] = useState<string>("");
  const [targetScore, setTargetScore] = useState<string>("");
  const [targetTestDate, setTargetTestDate] = useState("");
  const [minutes, setMinutes] = useState(15);
  const [studyDays, setStudyDays] = useState(5);
  const [preferredTime, setPreferredTime] = useState("");
  const [priority, setPriority] = useState<ReadingPriority>("balanced");

  const todayKey = browserDateKey();

  function chooseStyle(style: LearningStyle) {
    setLearningStyle(style);
    setMinutes(style === "daily-rhythm" ? 15 : 60);
    setStudyDays(style === "daily-rhythm" ? 5 : 4);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 4) {
      setStep((current) => current + 1);
      return;
    }
    setSaving(true);
    await completeStudyPlan({
      learningStyle,
      defaultDailyMinutes: minutes,
      studyDaysPerWeek: studyDays,
      currentReadingLevel: currentLevel ? Number(currentLevel) : null,
      targetReadingScore: targetScore ? Number(targetScore) : null,
      targetTestDate: targetTestDate || null,
      readingPriority: priority,
      timezone: browserTimezone(),
      preferredStudyTime: preferredTime || null,
      onboardingCompletedAt: null,
    });
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-ink/55 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <form
        onSubmit={handleSubmit}
        className="my-auto w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/50 bg-paper shadow-[0_30px_100px_rgba(37,33,31,0.3)]"
      >
        <header className="border-b border-ink/10 bg-cream px-5 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Badge tone="violet">Personalize your correction sprint</Badge>
            <span className="text-xs font-bold text-ink-muted">{step} / 4</span>
          </div>
          <Progress
            className="mt-4"
            value={(step / 4) * 100}
            label="Onboarding progress"
            tone="violet"
          />
        </header>

        <div className="max-h-[68dvh] overflow-y-auto px-5 py-7 sm:px-8 sm:py-9">
          {step === 1 ? (
            <section>
              <p className="text-xs font-bold tracking-[0.16em] text-coral-deep uppercase">
                Welcome, {student.name.split(" ")[0]}
              </p>
              <h1
                id="onboarding-title"
                className="mt-3 font-editorial text-4xl leading-none tracking-tight sm:text-5xl"
              >
                Build around the way you actually study.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-muted">
                Every plan protects the same ten-minute Daily Core. Your style
                changes what TraceTutor prepares when you have more time.
              </p>
              <fieldset className="mt-7 grid gap-3 sm:grid-cols-2">
                <legend className="sr-only">Learning style</legend>
                {(
                  [
                    [
                      "daily-rhythm",
                      "Daily Rhythm",
                      "10–30 minutes on more days, with a compact extension after the core.",
                    ],
                    [
                      "deep-focus",
                      "Deep Focus",
                      "45–120 minute sessions with blocks, breaks, and a saved stopping point.",
                    ],
                  ] as const
                ).map(([value, label, detail]) => (
                  <label
                    key={value}
                    className={cn(
                      "cursor-pointer rounded-3xl border p-5 transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet",
                      learningStyle === value
                        ? "border-violet bg-violet-soft"
                        : "border-ink/10 bg-white hover:border-ink/25",
                    )}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="learning-style"
                      checked={learningStyle === value}
                      onChange={() => chooseStyle(value)}
                    />
                    <span className="font-editorial text-2xl">{label}</span>
                    <span className="mt-2 block text-sm leading-6 text-ink-muted">
                      {detail}
                    </span>
                  </label>
                ))}
              </fieldset>
            </section>
          ) : null}

          {step === 2 ? (
            <section>
              <p className="text-xs font-bold tracking-[0.16em] text-violet uppercase">
                Starting point
              </p>
              <h1
                id="onboarding-title"
                className="mt-3 font-editorial text-4xl leading-none tracking-tight sm:text-5xl"
              >
                A direction, not a prediction.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-muted">
                These levels are self-reported planning context. TraceTutor
                never turns them into an official TOEFL score estimate.
              </p>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-bold">
                  Current Reading level
                  <select
                    value={currentLevel}
                    onChange={(event) => setCurrentLevel(event.target.value)}
                    className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-white px-4 text-base outline-none focus:border-violet focus:ring-4 focus:ring-violet/10"
                  >
                    <option value="">Not sure yet</option>
                    {scoreLevels.map((level) => (
                      <option key={level} value={level}>
                        {level.toFixed(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-bold">
                  Target Reading score
                  <select
                    value={targetScore}
                    onChange={(event) => setTargetScore(event.target.value)}
                    className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-white px-4 text-base outline-none focus:border-violet focus:ring-4 focus:ring-violet/10"
                  >
                    <option value="">Not set</option>
                    {scoreLevels.map((level) => (
                      <option key={level} value={level}>
                        {level.toFixed(1)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label
                className="mt-5 block text-sm font-bold"
                htmlFor="target-test-date"
              >
                Target test date{" "}
                <span className="font-normal text-ink-muted">(optional)</span>
              </label>
              <input
                id="target-test-date"
                type="date"
                min={todayKey}
                value={targetTestDate}
                onChange={(event) => setTargetTestDate(event.target.value)}
                className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-white px-4 text-base outline-none focus:border-violet focus:ring-4 focus:ring-violet/10"
              />
            </section>
          ) : null}

          {step === 3 ? (
            <section>
              <p className="text-xs font-bold tracking-[0.16em] text-mint-deep uppercase">
                Your realistic week
              </p>
              <h1
                id="onboarding-title"
                className="mt-3 font-editorial text-4xl leading-none tracking-tight sm:text-5xl"
              >
                Set a plan you can change tomorrow.
              </h1>
              <div className="mt-7 rounded-3xl border border-ink/10 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="study-minutes" className="text-sm font-bold">
                    Default study time
                  </label>
                  <strong className="font-editorial text-3xl text-violet">
                    {minutes} min
                  </strong>
                </div>
                <input
                  id="study-minutes"
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={minutes}
                  onChange={(event) => setMinutes(Number(event.target.value))}
                  className="mt-5 w-full accent-violet"
                />
                <div
                  className="mt-4 flex flex-wrap gap-2"
                  aria-label="Study time presets"
                >
                  {studyMinutePresets.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMinutes(value)}
                      className={cn(
                        "min-h-10 rounded-full border px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
                        minutes === value
                          ? "border-violet bg-violet text-white"
                          : "border-ink/10 bg-paper",
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-bold">
                  Study days per week
                  <select
                    value={studyDays}
                    onChange={(event) =>
                      setStudyDays(Number(event.target.value))
                    }
                    className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-white px-4 text-base outline-none focus:border-violet focus:ring-4 focus:ring-violet/10"
                  >
                    {[3, 4, 5, 6, 7].map((value) => (
                      <option key={value} value={value}>
                        {value} days
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-bold">
                  Preferred time{" "}
                  <span className="font-normal text-ink-muted">(optional)</span>
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(event) => setPreferredTime(event.target.value)}
                    className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-white px-4 text-base outline-none focus:border-violet focus:ring-4 focus:ring-violet/10"
                  />
                </label>
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section>
              <p className="text-xs font-bold tracking-[0.16em] text-coral-deep uppercase">
                Correction priority
              </p>
              <h1
                id="onboarding-title"
                className="mt-3 font-editorial text-4xl leading-none tracking-tight sm:text-5xl"
              >
                Choose today’s bias. Keep the full coverage.
              </h1>
              <fieldset className="mt-7">
                <legend className="sr-only">Reading priority</legend>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "cursor-pointer rounded-full border px-4 py-3 text-sm font-bold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet",
                        priority === option.value
                          ? "border-violet bg-violet text-white"
                          : "border-ink/10 bg-white",
                      )}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="priority"
                        checked={priority === option.value}
                        onChange={() => setPriority(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="bg-mint-soft mt-8 rounded-3xl border border-mint/60 p-5">
                <p className="text-xs font-bold tracking-[0.14em] text-mint-deep uppercase">
                  Your plan
                </p>
                <p className="mt-3 font-editorial text-2xl">
                  {learningStyle === "daily-rhythm"
                    ? "Daily Rhythm"
                    : "Deep Focus"}{" "}
                  · {minutes} minutes · {studyDays} days
                </p>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  Weekly target: {minutes * studyDays} active minutes. Daily
                  Core stays about ten minutes, and longer work is divided into
                  honest blocks.
                </p>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  Target practice score: {targetScore || "not decided"}
                  {targetTestDate
                    ? ` · ${Math.max(0, differenceInDays(targetTestDate, todayKey))} days to the target date`
                    : " · no test date set"}
                </p>
                <p className="mt-3 text-xs leading-5 font-semibold text-ink">
                  Timezone: {browserTimezone()} · Priority:{" "}
                  {
                    priorityOptions.find((option) => option.value === priority)
                      ?.label
                  }
                </p>
              </div>
            </section>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-ink/10 bg-cream px-5 py-4 sm:px-8">
          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((current) => current - 1)}
            >
              Previous
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : step === 4 ? "Build my plan" : "Continue"}
            <span aria-hidden="true">→</span>
          </Button>
        </footer>
      </form>
    </div>
  );
}

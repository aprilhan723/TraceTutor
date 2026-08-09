"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStudentDemo } from "@/components/student/student-demo-provider";
import type {
  DailyStudyMinutes,
  MainStruggle,
  ReadingConfidence,
} from "@/domain/study";
import { cn } from "@/lib/cn";

const confidenceOptions: Array<{
  value: ReadingConfidence;
  label: string;
  detail: string;
}> = [
  {
    value: "beginner",
    label: "Beginner",
    detail: "I need a clear starting point.",
  },
  {
    value: "developing",
    label: "Developing",
    detail: "I understand texts but lose points inconsistently.",
  },
  {
    value: "strong",
    label: "Strong",
    detail: "I want precise correction under pressure.",
  },
];

const struggleOptions: Array<{ value: MainStruggle; label: string }> = [
  { value: "vocabulary", label: "Vocabulary" },
  { value: "finding-evidence", label: "Finding evidence" },
  { value: "inference", label: "Inference" },
  { value: "time-pressure", label: "Time pressure" },
  { value: "not-sure", label: "Not sure yet" },
];

export function OnboardingFlow() {
  const { completeOnboarding, student } = useStudentDemo();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [targetTestDate, setTargetTestDate] = useState("2026-09-15");
  const [readingConfidence, setReadingConfidence] =
    useState<ReadingConfidence>("developing");
  const [dailyStudyMinutes, setDailyStudyMinutes] =
    useState<DailyStudyMinutes>(10);
  const [reminderTime, setReminderTime] = useState("19:30");
  const [mainStruggle, setMainStruggle] =
    useState<MainStruggle>("finding-evidence");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }
    setSaving(true);
    await completeOnboarding({
      targetTestDate,
      readingConfidence,
      dailyStudyMinutes,
      reminderTime,
      mainStruggle,
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
        className="my-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/50 bg-paper shadow-[0_30px_100px_rgba(37,33,31,0.3)]"
      >
        <header className="border-b border-ink/10 bg-cream px-5 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Badge tone="violet">Set up your 14-day sprint</Badge>
            <span className="text-xs font-bold text-ink-muted">{step} / 3</span>
          </div>
          <Progress
            className="mt-4"
            value={(step / 3) * 100}
            label="Onboarding progress"
            tone="violet"
          />
        </header>

        <div className="px-5 py-7 sm:px-8 sm:py-9">
          {step === 1 ? (
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-coral-deep uppercase">
                Welcome, {student.name.split(" ")[0]}
              </p>
              <h1
                id="onboarding-title"
                className="mt-3 font-editorial text-4xl leading-none tracking-tight sm:text-5xl"
              >
                Give today’s correction a destination.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-ink-muted">
                We’ll use your date to keep the sprint focused. It is planning
                context, not an official score prediction.
              </p>
              <label
                className="mt-8 block text-sm font-bold"
                htmlFor="target-test-date"
              >
                Target test date
              </label>
              <input
                id="target-test-date"
                type="date"
                min="2026-08-11"
                value={targetTestDate}
                onChange={(event) => setTargetTestDate(event.target.value)}
                required
                className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-white px-4 text-base transition outline-none focus:border-violet focus:ring-4 focus:ring-violet/10"
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-violet uppercase">
                Set the pace
              </p>
              <h1
                id="onboarding-title"
                className="mt-3 font-editorial text-4xl leading-none tracking-tight sm:text-5xl"
              >
                Small enough to finish. Focused enough to matter.
              </h1>
              <fieldset className="mt-7">
                <legend className="text-sm font-bold">
                  Current Reading confidence
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {confidenceOptions.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "cursor-pointer rounded-2xl border p-4 transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet",
                        readingConfidence === option.value
                          ? "border-violet bg-violet-soft"
                          : "border-ink/10 bg-white hover:border-ink/25",
                      )}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="reading-confidence"
                        value={option.value}
                        checked={readingConfidence === option.value}
                        onChange={() => setReadingConfidence(option.value)}
                      />
                      <span className="text-sm font-bold">{option.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-ink-muted">
                        {option.detail}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-7">
                <legend className="text-sm font-bold">Daily study time</legend>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {([5, 10, 15] as const).map((minutes) => (
                    <label
                      key={minutes}
                      className={cn(
                        "grid min-h-14 cursor-pointer place-items-center rounded-2xl border text-sm font-bold transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-coral",
                        dailyStudyMinutes === minutes
                          ? "border-coral bg-coral-soft"
                          : "border-ink/10 bg-white hover:border-ink/25",
                      )}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="daily-study-time"
                        value={minutes}
                        checked={dailyStudyMinutes === minutes}
                        onChange={() => setDailyStudyMinutes(minutes)}
                      />
                      {minutes} minutes
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-mint-deep uppercase">
                Aim the correction
              </p>
              <h1
                id="onboarding-title"
                className="mt-3 font-editorial text-4xl leading-none tracking-tight sm:text-5xl"
              >
                What most often gets in your way?
              </h1>
              <label
                className="mt-7 block text-sm font-bold"
                htmlFor="reminder-time"
              >
                Preferred reminder time
              </label>
              <input
                id="reminder-time"
                type="time"
                value={reminderTime}
                onChange={(event) => setReminderTime(event.target.value)}
                required
                className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-white px-4 text-base transition outline-none focus:border-violet focus:ring-4 focus:ring-violet/10"
              />

              <fieldset className="mt-7">
                <legend className="text-sm font-bold">
                  Main Reading struggle
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {struggleOptions.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "cursor-pointer rounded-full border px-4 py-3 text-sm font-bold transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-violet",
                        mainStruggle === option.value
                          ? "border-violet bg-violet text-white"
                          : "border-ink/10 bg-white hover:border-ink/25",
                      )}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="main-struggle"
                        value={option.value}
                        checked={mainStruggle === option.value}
                        onChange={() => setMainStruggle(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-ink/10 bg-cream px-5 py-4 sm:px-8">
          {step > 1 ? (
            <Button
              variant="ghost"
              onClick={() => setStep((current) => current - 1)}
            >
              Previous
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : step === 3 ? "Build my sprint" : "Continue"}
            <span aria-hidden="true">→</span>
          </Button>
        </footer>
      </form>
    </div>
  );
}

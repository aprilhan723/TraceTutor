"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useStudentDemo } from "@/components/student/student-demo-provider";
import type { LearningStyle, ReadingPriority } from "@/domain/study";
import { isValidTimeZone } from "@/services/personalized-learning";

const scoreLevels = Array.from({ length: 11 }, (_, index) => 1 + index * 0.5);

function localDateKey() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

export function StudyPlanSettings() {
  const { hydrated, state, completeStudyPlan, respondToStudyRecommendation } =
    useStudentDemo();
  const plan = state?.studyPlan;
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!hydrated || !plan)
    return (
      <Card
        className="h-72 animate-pulse motion-reduce:animate-none"
        aria-label="Loading study settings"
      />
    );
  const existingPlan = plan;
  const pendingRecommendation = state.tutorRecommendations.find(
    (entry) => !entry.acknowledgedAt,
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const style = String(form.get("learningStyle")) as LearningStyle;
    const minutes = Number(form.get("defaultDailyMinutes"));
    const days = Number(form.get("studyDaysPerWeek"));
    const weeklyGoal = Number(form.get("weeklyGoalMinutes"));
    const currentLevel = String(form.get("currentReadingLevel") ?? "");
    const targetScore = String(form.get("targetReadingScore") ?? "");
    const priority = String(form.get("readingPriority")) as ReadingPriority;
    const date = String(form.get("targetTestDate") ?? "");
    const time = String(form.get("preferredStudyTime") ?? "");
    const timezone = String(form.get("timezone") ?? "");
    if (!isValidTimeZone(timezone)) {
      setError("Enter a valid IANA timezone, such as Asia/Seoul or UTC.");
      return;
    }
    if (date && date < localDateKey()) {
      setError("The target test date cannot be in the past.");
      return;
    }
    if (
      (minutes < existingPlan.defaultDailyMinutes ||
        weeklyGoal < existingPlan.weeklyGoalMinutes ||
        days < existingPlan.studyDaysPerWeek) &&
      !window.confirm(
        "Reduce the future study plan? Completed work and historical goals will stay unchanged.",
      )
    ) {
      return;
    }
    await completeStudyPlan({
      ...existingPlan,
      learningStyle: style,
      defaultDailyMinutes: minutes,
      weeklyGoalMinutes: weeklyGoal,
      studyDaysPerWeek: days,
      currentReadingLevel: currentLevel ? Number(currentLevel) : null,
      targetReadingScore: targetScore ? Number(targetScore) : null,
      readingPriority: priority,
      targetTestDate: date || null,
      preferredStudyTime: time || null,
      timezone,
      onboardingCompletedAt: existingPlan.onboardingCompletedAt,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Learner controls"
        title="Study Plan"
        description="Your tutor can recommend a change, but your default schedule and learning style remain yours to accept or edit."
        action={saved ? <Badge tone="mint">Plan saved</Badge> : undefined}
      />
      {pendingRecommendation ? (
        <Card tone="violet" className="mt-7">
          <Badge tone="violet">Tutor recommendation</Badge>
          <h2 className="mt-3 font-editorial text-3xl">
            A suggested adjustment—not an override
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            {pendingRecommendation.note}
          </p>
          <p className="mt-3 text-sm font-bold capitalize">
            {pendingRecommendation.weeklyGoalMinutes
              ? `${pendingRecommendation.weeklyGoalMinutes} weekly minutes · `
              : ""}
            {pendingRecommendation.readingPriority?.replaceAll("-", " ") ??
              "current priority"}
            {" · "}
            {pendingRecommendation.sessionType ?? "current session type"}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() =>
                void respondToStudyRecommendation(
                  pendingRecommendation.id,
                  true,
                ).then(() => window.location.reload())
              }
            >
              Accept recommendation
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                void respondToStudyRecommendation(
                  pendingRecommendation.id,
                  false,
                ).then(() => window.location.reload())
              }
            >
              Keep my current plan
            </Button>
          </div>
        </Card>
      ) : null}
      <form onSubmit={save} className="mt-7 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-editorial text-3xl">Rhythm and time</h2>
          <label className="mt-5 block text-sm font-bold">
            Learning style
            <select
              name="learningStyle"
              defaultValue={existingPlan.learningStyle}
              className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-paper px-4"
            >
              <option value="daily-rhythm">Daily Rhythm</option>
              <option value="deep-focus">Deep Focus</option>
            </select>
          </label>
          <label
            className="mt-5 block text-sm font-bold"
            htmlFor="settings-minutes"
          >
            Default active minutes
            <input
              id="settings-minutes"
              name="defaultDailyMinutes"
              className="mt-3 w-full accent-violet"
              type="range"
              min="10"
              max="120"
              step="5"
              defaultValue={existingPlan.defaultDailyMinutes}
            />
          </label>
          <label className="mt-5 block text-sm font-bold">
            Study days per week
            <select
              name="studyDaysPerWeek"
              defaultValue={existingPlan.studyDaysPerWeek}
              className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-paper px-4"
            >
              {[3, 4, 5, 6, 7].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="mt-5 block text-sm font-bold">
            Weekly active-minute goal
            <input
              name="weeklyGoalMinutes"
              type="number"
              min="30"
              max="840"
              defaultValue={existingPlan.weeklyGoalMinutes}
              className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-paper px-4"
            />
          </label>
        </Card>
        <Card>
          <h2 className="font-editorial text-3xl">Correction direction</h2>
          <label className="mt-5 block text-sm font-bold">
            Reading priority
            <select
              name="readingPriority"
              defaultValue={existingPlan.readingPriority}
              className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-paper px-4"
            >
              <option value="balanced">Balanced correction</option>
              <option value="complete-words">Complete the Words</option>
              <option value="daily-life">Read in Daily Life</option>
              <option value="academic">Academic passage</option>
              <option value="mistake-review">Mistake review</option>
            </select>
          </label>
          <label className="mt-5 block text-sm font-bold">
            Current self-reported Reading level
            <select
              name="currentReadingLevel"
              defaultValue={existingPlan.currentReadingLevel ?? ""}
              className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-paper px-4"
            >
              <option value="">I am not sure</option>
              {scoreLevels.map((value) => (
                <option key={value} value={value}>
                  {value.toFixed(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-5 block text-sm font-bold">
            Target Reading score
            <select
              name="targetReadingScore"
              defaultValue={existingPlan.targetReadingScore ?? ""}
              className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-paper px-4"
            >
              <option value="">I have not decided yet</option>
              {scoreLevels.map((value) => (
                <option key={value} value={value}>
                  {value.toFixed(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-5 block text-sm font-bold">
            Target test date{" "}
            <span className="font-normal text-ink-muted">(optional)</span>
            <input
              type="date"
              name="targetTestDate"
              min={localDateKey()}
              defaultValue={existingPlan.targetTestDate ?? ""}
              className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-paper px-4"
            />
          </label>
          <label className="mt-5 block text-sm font-bold">
            Preferred study time{" "}
            <span className="font-normal text-ink-muted">(optional)</span>
            <input
              type="time"
              name="preferredStudyTime"
              defaultValue={existingPlan.preferredStudyTime ?? ""}
              className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-paper px-4"
            />
          </label>
          <label className="mt-5 block text-sm font-bold">
            Timezone
            <input
              type="text"
              name="timezone"
              defaultValue={existingPlan.timezone}
              placeholder="Asia/Seoul"
              className="mt-2 min-h-13 w-full rounded-2xl border border-ink/15 bg-paper px-4"
            />
          </label>
        </Card>
        <Card tone="violet" className="lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold">
                Weekly goal: {existingPlan.weeklyGoalMinutes} active minutes
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Only active, visible, recently interacted study time counts.
                Changing this plan does not erase history.
              </p>
            </div>
            <Button type="submit">Save study plan</Button>
          </div>
          {error ? (
            <p className="mt-4 text-sm font-bold text-coral-deep" role="alert">
              {error}
            </p>
          ) : null}
        </Card>
      </form>
    </div>
  );
}

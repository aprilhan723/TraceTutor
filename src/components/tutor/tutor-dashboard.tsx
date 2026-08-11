"use client";

import { useState } from "react";
import type { Route } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useTutorDemo } from "@/components/tutor/tutor-demo-provider";
import type { ReadingPriority } from "@/domain/study";
import { addDays } from "@/lib/clock";

function LoadingDashboard() {
  return (
    <div
      className="animate-pulse motion-reduce:animate-none"
      aria-label="Loading tutor workspace"
    >
      <div className="h-4 w-44 rounded-full bg-violet/15" />
      <div className="mt-5 h-16 max-w-2xl rounded-2xl bg-ink/8" />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="h-32 rounded-3xl bg-white" />
        <div className="h-32 rounded-3xl bg-white" />
        <div className="h-32 rounded-3xl bg-white" />
      </div>
    </div>
  );
}

export function TutorDashboard() {
  const { hydrated, bundle, recommendStudyPlan } = useTutorDemo();
  const [goal, setGoal] = useState(120);
  const [priority, setPriority] = useState<ReadingPriority>("mistake-review");
  const [sessionType, setSessionType] = useState<"focused" | "deep">("focused");
  const [recommendationSaved, setRecommendationSaved] = useState(false);
  if (!hydrated || !bundle) return <LoadingDashboard />;

  const { dashboard } = bundle;
  const study = bundle.studyState;
  const weekStart = addDays(bundle.todayKey, -6);
  const recentProgress = study.dailyProgress.filter(
    (entry) =>
      entry.localDate >= weekStart && entry.localDate <= bundle.todayKey,
  );
  const activeMinutes = Math.round(
    recentProgress.reduce((sum, entry) => sum + entry.activeSeconds, 0) / 60,
  );
  const coreCompletion = recentProgress.length
    ? Math.round(
        (recentProgress.filter((entry) => entry.dailyCoreCompleted).length /
          7) *
          100,
      )
    : 0;
  const recentSession = [...study.studySessions]
    .filter((session) => session.questionsAnswered > 0)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  const contentWarning = study.studySessions.some(
    (session) => session.contentShortage,
  );
  const metrics = [
    {
      label: "Unresolved diagnoses",
      value: dashboard.metrics.unresolvedDiagnoses,
      tone: "violet" as const,
    },
    {
      label: "High-confidence wrong",
      value: dashboard.metrics.highConfidenceWrong,
      tone: "coral" as const,
    },
    {
      label: "Due / failed D2–D7",
      value: dashboard.metrics.dueOrFailedReviews,
      tone: "coral" as const,
    },
    {
      label: "Recently corrected",
      value: dashboard.metrics.recentCorrectedErrors,
      tone: "mint" as const,
    },
    {
      label: "Median review time",
      value:
        dashboard.metrics.medianReviewMinutes === null
          ? "—"
          : `${dashboard.metrics.medianReviewMinutes}m`,
      tone: "paper" as const,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={`Today · ${bundle.todayKey}`}
        title="Today’s Intervention Queue"
        description="Review the few traces where a human decision can change the next correction—not a wall of vanity charts."
        action={<Badge tone="mint">Tutor workspace · Local demo</Badge>}
      />

      <section
        aria-label="Tutor action metrics"
        className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      >
        {metrics.map((metric) => (
          <Card key={metric.label} tone={metric.tone} className="p-5">
            <p className="text-xs font-bold tracking-wide text-ink-muted uppercase">
              {metric.label}
            </p>
            <p className="mt-3 font-editorial text-4xl font-bold">
              {metric.value}
            </p>
          </Card>
        ))}
      </section>

      <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.55fr)]">
        <section aria-labelledby="queue-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
                Highest-leverage first
              </p>
              <h2
                id="queue-heading"
                className="mt-1 font-editorial text-3xl font-bold"
              >
                Needs your decision
              </h2>
            </div>
            <Badge tone="neutral">{dashboard.queue.length} open</Badge>
          </div>

          <div className="space-y-4">
            {dashboard.queue.map((item, index) => {
              const student = bundle.students.find(
                (candidate) => candidate.id === item.studentId,
              );
              return (
                <Card key={item.caseId} className="overflow-hidden p-0">
                  <div className="p-5 sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-4">
                        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mint font-bold text-mint-deep">
                          {student?.initials ?? "JP"}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-ink-muted">
                              #{index + 1} · {student?.name ?? "Student"}
                            </span>
                            <Badge
                              tone={
                                item.priority === "high" ? "coral" : "violet"
                              }
                            >
                              {item.priority} priority
                            </Badge>
                          </div>
                          <h3 className="mt-2 font-editorial text-2xl font-bold">
                            {item.patternLabel}
                          </h3>
                        </div>
                      </div>
                      <Button
                        href={`/tutor/review/${item.caseId}` as Route}
                        variant="secondary"
                        size="sm"
                      >
                        Review diagnosis →
                      </Button>
                    </div>
                    <div className="mt-5 rounded-2xl bg-violet-soft p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold tracking-wide text-violet uppercase">
                          Why this is prioritized
                        </p>
                        <span className="text-xs font-bold text-violet-deep">
                          transparent score {item.priorityScore}
                        </span>
                      </div>
                      <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink-muted sm:grid-cols-2">
                        {item.reasons.map((reason) => (
                          <li key={reason} className="flex gap-2">
                            <span aria-hidden="true" className="text-violet">
                              •
                            </span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs leading-5 text-ink-muted">
                        The score orders observable instructional signals. It is
                        not a psychological profile or truth claim.
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <aside className="space-y-5" aria-label="Class and correction trend">
          <Card tone="violet">
            <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
              Engagement summary
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-ink-muted">Learner default</dt>
                <dd className="mt-1 font-bold">
                  {study.studyPlan?.defaultDailyMinutes ?? "—"} min ·{" "}
                  {study.studyPlan?.studyDaysPerWeek ?? "—"} days
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Weekly goal</dt>
                <dd className="mt-1 font-bold">
                  {study.studyPlan?.weeklyGoalMinutes ?? "—"} min
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Active this week</dt>
                <dd className="mt-1 font-bold">{activeMinutes} min</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Correction Streak</dt>
                <dd className="mt-1 font-bold">
                  {study.streakStats.current} days
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Daily Core rate</dt>
                <dd className="mt-1 font-bold">{coreCompletion}%</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Best window</dt>
                <dd className="mt-1 font-bold">Not enough data</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Overdue reviews</dt>
                <dd className="mt-1 font-bold">
                  {dashboard.metrics.dueOrFailedReviews}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Recent session</dt>
                <dd className="mt-1 font-bold capitalize">
                  {recentSession
                    ? `${recentSession.plannedMinutes}m ${recentSession.topic.replaceAll("-", " ")}`
                    : "No saved session"}
                </dd>
              </div>
            </dl>
            {contentWarning ? (
              <div className="mt-5 rounded-2xl border border-coral/25 bg-coral-soft p-4">
                <p className="text-sm font-bold text-coral-deep">
                  Reviewed-content sufficiency warning
                </p>
                <p className="mt-2 text-xs leading-5 text-ink-muted">
                  A recent requested plan ended early rather than repeating
                  unseen items. Add reviewed content through the Content library
                  before assigning another long block.
                </p>
              </div>
            ) : null}
            <div className="mt-5 border-t border-violet/15 pt-5">
              <p className="text-sm font-bold">Recommend—do not override</p>
              <label className="mt-3 block text-xs font-bold">
                Weekly minutes
                <select
                  value={goal}
                  onChange={(event) => setGoal(Number(event.target.value))}
                  className="mt-1 min-h-10 w-full rounded-xl border border-violet/20 bg-white px-3 text-sm"
                >
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                  <option value="180">180 minutes</option>
                  <option value="240">240 minutes</option>
                </select>
              </label>
              <label className="mt-3 block text-xs font-bold">
                Reading priority
                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as ReadingPriority)
                  }
                  className="mt-1 min-h-10 w-full rounded-xl border border-violet/20 bg-white px-3 text-sm"
                >
                  <option value="balanced">Balanced</option>
                  <option value="complete-words">Complete the Words</option>
                  <option value="daily-life">Daily Life</option>
                  <option value="academic">Academic</option>
                  <option value="mistake-review">Mistake review</option>
                </select>
              </label>
              <label className="mt-3 block text-xs font-bold">
                Session type
                <select
                  value={sessionType}
                  onChange={(event) =>
                    setSessionType(event.target.value as "focused" | "deep")
                  }
                  className="mt-1 min-h-10 w-full rounded-xl border border-violet/20 bg-white px-3 text-sm"
                >
                  <option value="focused">Focused 30-minute</option>
                  <option value="deep">Deep 60-minute</option>
                </select>
              </label>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4 w-full"
                onClick={() =>
                  void recommendStudyPlan({
                    weeklyGoalMinutes: goal,
                    readingPriority: priority,
                    sessionType,
                    note: "Tutor recommendation based on current adherence and recurring corrections.",
                  }).then(() => setRecommendationSaved(true))
                }
              >
                {recommendationSaved
                  ? "Recommendation saved"
                  : "Send recommendation"}
              </Button>
              <p className="mt-3 text-xs leading-5 text-ink-muted">
                The learner keeps control of their schedule and must accept any
                change.
              </p>
            </div>
          </Card>
          <Card tone="mint">
            <p className="text-xs font-bold tracking-[0.14em] text-mint-deep uppercase">
              Compact student trend
            </p>
            <p className="mt-4 font-editorial text-4xl font-bold">
              {dashboard.trend?.adherencePercentage ?? 0}%
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              10-day mission adherence
            </p>
            <div className="mt-5 border-t border-mint-deep/15 pt-4">
              <p className="text-sm font-bold">
                Accuracy{" "}
                {dashboard.trend && dashboard.trend.accuracyChange >= 0
                  ? "+"
                  : ""}
                {dashboard.trend?.accuracyChange ?? 0} points
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-muted">
                Recent half versus earlier half. One student today; the model
                supports a larger roster later.
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-editorial text-2xl font-bold">
                Recent corrections
              </h2>
              <Badge tone="mint">Verified</Badge>
            </div>
            <div className="mt-4 space-y-4">
              {dashboard.recentCorrected.map((item) => (
                <div
                  key={item.id}
                  className="border-t border-ink/10 pt-4 first:border-0 first:pt-0"
                >
                  <p className="text-sm font-bold">{item.patternLabel}</p>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">
                    {item.adjudication.status === "changed"
                      ? "Tutor changed the primary cause"
                      : "Tutor approved the diagnosis"}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card tone="violet">
            <p className="text-sm leading-6 text-ink-muted">
              All signals are instructional evidence from original practice.
              TraceTutor is independent, not endorsed by ETS, and provides no
              official TOEFL score.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

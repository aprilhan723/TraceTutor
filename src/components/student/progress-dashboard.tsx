"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { useStudentDemo } from "@/components/student/student-demo-provider";

function formatHistoryDate(dateKey: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T12:00:00.000Z`));
}

export function ProgressDashboard() {
  const { hydrated, state, metrics } = useStudentDemo();
  if (!hydrated || !state?.onboarding || !metrics) {
    return null;
  }

  const completedSprintDays = state.missionHistory.filter(
    (mission) => mission.dayNumber > 0,
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="Retention over volume"
        title="Progress"
        description="See what held, what still needs evidence, and whether confidence matches performance."
        action={
          <Badge tone="mint">{completedSprintDays} / 14 sprint days</Badge>
        }
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <Card tone="violet">
          <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
            Evidence accuracy
          </p>
          <p className="mt-4 font-editorial text-5xl font-bold">
            {metrics.evidencePercentage}%
          </p>
          <Progress
            className="mt-5"
            value={metrics.evidencePercentage}
            label="Evidence accuracy"
            tone="violet"
          />
          <p className="mt-3 text-xs leading-5 text-ink-muted">
            {metrics.evidenceCorrect} of {metrics.evidenceTotal} evidence traces
            supported the answer.
          </p>
        </Card>

        <Card tone="mint">
          <p className="text-xs font-bold tracking-[0.14em] text-mint-deep uppercase">
            Confidence calibration
          </p>
          <p className="mt-4 font-editorial text-5xl font-bold">
            {metrics.calibrationPercentage}%
          </p>
          <Progress
            className="mt-5"
            value={metrics.calibrationPercentage}
            label="Confidence calibration"
            tone="mint"
          />
          <p className="mt-3 text-xs leading-5 text-ink-muted">
            {metrics.calibratedAttempts} of {metrics.confidenceAttempts}{" "}
            confidence calls matched the result direction.
          </p>
        </Card>

        <Card tone="coral">
          <p className="text-xs font-bold tracking-[0.14em] text-coral-deep uppercase">
            Correction Streak
          </p>
          <p className="mt-4 font-editorial text-5xl font-bold">
            {state.correctionStreak}
          </p>
          <p className="mt-5 text-sm leading-6 text-ink-muted">
            Consecutive corrections—not points, XP, or an official score.
          </p>
        </Card>
      </div>

      <section className="mt-8" aria-labelledby="task-accuracy-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
              Observable task behavior
            </p>
            <h2
              id="task-accuracy-heading"
              className="mt-2 font-editorial text-3xl"
            >
              Accuracy by task type
            </h2>
          </div>
          <span className="text-xs text-ink-muted">Practice feedback only</span>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {metrics.taskAccuracy.map((metric) => (
            <Card key={metric.taskType}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="max-w-40 font-bold">{metric.label}</h3>
                <span className="font-editorial text-3xl font-bold">
                  {metric.percentage}%
                </span>
              </div>
              <Progress
                className="mt-5"
                value={metric.percentage}
                label={`${metric.label} practice accuracy`}
              />
              <p className="mt-3 text-xs text-ink-muted">
                {metric.correct} correct of {metric.total} attempts
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="history-heading">
        <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
          Mission history
        </p>
        <h2 id="history-heading" className="mt-2 font-editorial text-3xl">
          Corrections completed
        </h2>
        <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white shadow-sm">
          <ul className="divide-y divide-ink/10">
            {[...state.missionHistory].reverse().map((mission) => (
              <li
                key={mission.missionId}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"
              >
                <div className="flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-violet-soft font-editorial font-bold text-violet">
                    {mission.dayNumber === 0 ? "B" : mission.dayNumber}
                  </span>
                  <div>
                    <h3 className="font-bold">{mission.title}</h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      {formatHistoryDate(mission.dateKey)} ·{" "}
                      {mission.estimatedMinutes} min
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-6 sm:justify-end">
                  <div className="text-right">
                    <p className="font-editorial text-2xl font-bold">
                      {mission.secureCount}/{mission.attemptCount}
                    </p>
                    <p className="text-xs text-ink-muted">secure</p>
                  </div>
                  <Badge
                    tone={
                      mission.secureCount === mission.attemptCount
                        ? "mint"
                        : "violet"
                    }
                  >
                    {mission.dayNumber === 0 ? "Baseline" : "Complete"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="mt-8 rounded-2xl border border-ink/10 bg-cream-deep/50 p-4 text-xs leading-5 text-ink-muted">
        TraceTutor is independent practice software and is not endorsed by ETS.
        These metrics describe local practice behavior; they are not an official
        TOEFL score or score estimate.
      </p>
    </div>
  );
}

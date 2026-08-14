"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { useStudentDemo } from "@/components/student/student-demo-provider";
import { differenceInDays } from "@/lib/clock";

function ratio(value: number | null, suffix = "%") {
  return value === null ? "Not enough data" : `${value}${suffix}`;
}

function MetricCard({
  label,
  value,
  detail,
  tone = "paper",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "paper" | "violet" | "mint" | "coral";
}) {
  return (
    <Card tone={tone}>
      <p className="text-xs font-bold tracking-[0.13em] text-ink-muted uppercase">
        {label}
      </p>
      <p className="mt-3 font-editorial text-4xl">{value}</p>
      <p className="mt-2 text-xs leading-5 text-ink-muted">{detail}</p>
    </Card>
  );
}

export function ProgressDashboard() {
  const { hydrated, state, metrics, vecr7, programDateKey } = useStudentDemo();
  if (!hydrated || !state?.studyPlan || !metrics)
    return (
      <Card
        className="h-80 animate-pulse motion-reduce:animate-none"
        aria-label="Loading progress"
      />
    );
  const completedSprintDays = state.missionHistory.filter(
    (mission) => mission.dayNumber > 0,
  ).length;
  const activeSessions = state.studySessions.filter(
    (session) => session.questionsAnswered > 0,
  );
  const daysUntilTest =
    state.studyPlan.targetTestDate && programDateKey
      ? Math.max(
          0,
          differenceInDays(state.studyPlan.targetTestDate, programDateKey),
        )
      : null;

  return (
    <div>
      <PageHeader
        eyebrow="Account progress"
        title="Progress"
        description="Active time, practice outcomes, evidence, confidence, correction, and retention—kept separate so one metric cannot pretend to explain everything."
        action={
          <Badge tone="mint">{completedSprintDays} / 14 sprint days</Badge>
        }
      />
      <nav
        className="mt-6 flex gap-2 overflow-x-auto pb-2"
        aria-label="Progress sections"
      >
        {[
          "Overview",
          "Study time",
          "Performance",
          "Corrections",
          "Retention",
          "Sessions",
        ].map((label) => (
          <a
            key={label}
            href={`#${label.toLowerCase().replaceAll(" ", "-")}`}
            className="min-h-10 shrink-0 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
          >
            {label}
          </a>
        ))}
      </nav>

      <section
        id="overview"
        className="mt-6 scroll-mt-24"
        aria-labelledby="overview-heading"
      >
        <h2 id="overview-heading" className="sr-only">
          Overview
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            tone="coral"
            label="Current Correction Streak"
            value={`${metrics.currentCorrectionStreak} days`}
            detail={`Longest ${metrics.longestCorrectionStreak}. One meaningful completion per local day.`}
          />
          <MetricCard
            tone="violet"
            label="Weekly active time"
            value={`${metrics.weeklyActiveMinutes} min`}
            detail={`${metrics.activeStudyDays} active days · ${metrics.weeklyGoalMinutes}-minute goal`}
          />
          <MetricCard
            tone="mint"
            label="Questions answered"
            value={String(metrics.totalQuestionsAnswered)}
            detail="Original independent practice items only."
          />
          <MetricCard
            label="Recent accuracy"
            value={ratio(metrics.recentAccuracy)}
            detail="Last ten attempts; practice feedback, not an official score."
          />
          <MetricCard
            label="Target and countdown"
            value={daysUntilTest === null ? "Not set" : `D-${daysUntilTest}`}
            detail={
              state.studyPlan.targetReadingScore === null
                ? "No target practice score set."
                : `Self-selected target ${state.studyPlan.targetReadingScore.toFixed(1)}; not an official score forecast.`
            }
          />
        </div>
      </section>

      <section
        id="study-time"
        className="mt-9 scroll-mt-24"
        aria-labelledby="study-time-heading"
      >
        <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
          Study Time
        </p>
        <h2 id="study-time-heading" className="mt-2 font-editorial text-3xl">
          Time that was actually active
        </h2>
        <Card className="mt-4">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-editorial text-5xl">
                {metrics.weeklyActiveMinutes}{" "}
                <span className="text-2xl">minutes</span>
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                Today: {metrics.todayActiveMinutes} minutes · Week:{" "}
                {metrics.activeStudyDays} active days
              </p>
            </div>
            <div className="w-full max-w-md">
              <Progress
                value={
                  (metrics.weeklyActiveMinutes /
                    Math.max(1, metrics.weeklyGoalMinutes)) *
                  100
                }
                label="Weekly active study time"
                tone="violet"
              />
              <p className="mt-3 text-xs leading-5 text-ink-muted">
                Hidden, paused, and 90-second idle periods are excluded. Legacy
                sessions without supported timing remain blank.
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section
        id="performance"
        className="mt-9 scroll-mt-24"
        aria-labelledby="performance-heading"
      >
        <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
          Performance
        </p>
        <h2 id="performance-heading" className="mt-2 font-editorial text-3xl">
          Task behavior and calibration
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {metrics.taskAccuracy.map((metric) => (
            <Card key={metric.taskType}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="max-w-40 font-bold">{metric.label}</h3>
                <span className="font-editorial text-3xl">
                  {metric.total ? `${metric.percentage}%` : "—"}
                </span>
              </div>
              <Progress
                className="mt-5"
                value={metric.percentage}
                label={`${metric.label} practice accuracy`}
              />
              <p className="mt-3 text-xs text-ink-muted">
                {metric.total
                  ? `${metric.correct} correct of ${metric.total}`
                  : "No attempts yet"}
              </p>
            </Card>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="7-day accuracy"
            value={ratio(metrics.sevenDayAccuracy)}
            detail="Attempts in the current seven-day window."
          />
          <MetricCard
            label="30-day accuracy"
            value={ratio(metrics.thirtyDayAccuracy)}
            detail={
              metrics.hasAccuracyTrend
                ? "Enough observations for a directional view."
                : "More attempts are needed for a stable trend."
            }
          />
          <MetricCard
            tone="violet"
            label="Evidence accuracy"
            value={
              metrics.evidenceTotal
                ? `${metrics.evidencePercentage}%`
                : "Not enough data"
            }
            detail={`${metrics.evidenceCorrect} supported traces of ${metrics.evidenceTotal}.`}
          />
          <MetricCard
            tone="mint"
            label="Confidence calibration"
            value={
              metrics.confidenceAttempts
                ? `${metrics.calibrationPercentage}%`
                : "Not enough data"
            }
            detail={`High-confidence wrong rate: ${ratio(metrics.highConfidenceWrongRate)}`}
          />
        </div>
      </section>

      <section
        id="corrections"
        className="mt-9 scroll-mt-24"
        aria-labelledby="corrections-heading"
      >
        <p className="text-xs font-bold tracking-[0.14em] text-coral-deep uppercase">
          Corrections
        </p>
        <h2 id="corrections-heading" className="mt-2 font-editorial text-3xl">
          What is improving, recurring, or unresolved
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MetricCard
            tone="mint"
            label="Corrected patterns"
            value={String(metrics.correctedErrorCount)}
            detail="Improving or resolved under the retention rules."
          />
          <MetricCard
            tone="coral"
            label="Recurring patterns"
            value={String(metrics.recurringErrorCount)}
            detail="Repeated signals, not fixed personality labels."
          />
          <MetricCard
            tone="violet"
            label="Unresolved diagnoses"
            value={String(
              state.diagnoses.filter((entry) => entry.tutorReviewRequired)
                .length,
            )}
            detail="Still needs tutor judgment or more evidence."
          />
        </div>
      </section>

      <section
        id="retention"
        className="mt-9 scroll-mt-24"
        aria-labelledby="retention-heading"
      >
        <p className="text-xs font-bold tracking-[0.14em] text-mint-deep uppercase">
          Retention
        </p>
        <h2 id="retention-heading" className="mt-2 font-editorial text-3xl">
          Transfer and scheduled returns
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Immediate transfer"
            value={ratio(metrics.immediateTransferRate)}
            detail="Fresh-context transfer after correction."
          />
          <MetricCard
            tone="violet"
            label="2-day retention"
            value={ratio(metrics.d2RetentionRate)}
            detail="Completed Day 2 returns only."
          />
          <MetricCard
            tone="coral"
            label="7-day retention"
            value={ratio(metrics.d7RetentionRate)}
            detail="Completed Day 7 returns only."
          />
          <MetricCard
            label="Review completion"
            value={ratio(metrics.dueReviewCompletionRate)}
            detail="Scheduled review entries completed."
          />
          <MetricCard
            tone="mint"
            label="Verified 7-day correction rate"
            value={
              vecr7?.rate === null || vecr7 === null
                ? "Not enough data"
                : `${vecr7.rate}%`
            }
            detail={
              vecr7?.eligibleDiagnoses
                ? `${vecr7.retainedDiagnoses} verified corrections of ${vecr7.eligibleDiagnoses} eligible 7-day review opportunities.`
                : "Complete an eligible 7-day review to unlock this metric."
            }
          />
        </div>
      </section>

      <section
        id="sessions"
        className="mt-9 scroll-mt-24"
        aria-labelledby="sessions-heading"
      >
        <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
          Session history
        </p>
        <h2 id="sessions-heading" className="mt-2 font-editorial text-3xl">
          Saved study blocks
        </h2>
        {activeSessions.length ? (
          <div className="mt-4 overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white">
            <ul className="divide-y divide-ink/10">
              {[...activeSessions].reverse().map((session) => (
                <li
                  key={session.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex gap-2">
                      <Badge
                        tone={
                          session.status === "completed" ? "mint" : "violet"
                        }
                      >
                        {session.status}
                      </Badge>
                      <Badge>{session.sessionType}</Badge>
                    </div>
                    <h3 className="mt-2 font-bold">
                      {session.plannedMinutes}-minute{" "}
                      {session.topic.replaceAll("-", " ")} session
                    </h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      {Math.round(session.activeSeconds / 60)} active minutes ·{" "}
                      {session.questionsAnswered} questions
                    </p>
                  </div>
                  <p className="font-editorial text-2xl">
                    {session.questionsAnswered
                      ? Math.round(
                          (session.correctAnswers / session.questionsAnswered) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Card className="mt-4">
            <p className="text-sm text-ink-muted">
              No personalized session has enough supported activity to summarize
              yet.
            </p>
          </Card>
        )}
      </section>

      <p className="mt-9 rounded-2xl border border-ink/10 bg-cream-deep/50 p-4 text-xs leading-5 text-ink-muted">
        TraceTutor is independent practice software and is not endorsed by ETS.
        These metrics describe supported practice behavior; they are not an
        official TOEFL score or score estimate.
      </p>
    </div>
  );
}

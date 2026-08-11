"use client";

import type { Route } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import {
  getProofSproutStage,
  ProofSprout,
  proofSproutStageLabels,
} from "@/components/student/proof-sprout";
import { useStudentDemo } from "@/components/student/student-demo-provider";
import { useTutorDemo } from "@/components/tutor/tutor-demo-provider";
import type { MissionPartKind } from "@/domain/study";
import { differenceInDays } from "@/lib/clock";
import { cn } from "@/lib/cn";
import { buildSevenDayConsistency } from "@/services/personalized-learning";

const partLabels: Record<
  MissionPartKind,
  { label: string; detail: string; symbol: string }
> = {
  review: {
    label: "Due review",
    detail: "Recover an earlier correction before new practice",
    symbol: "D",
  },
  speed: {
    label: "Speed Lane",
    detail: "Complete the Words with grammar and context signals",
    symbol: "S",
  },
  thinking: {
    label: "Thinking Lane",
    detail: "Answer, calibrate confidence, and trace evidence",
    symbol: "T",
  },
  transfer: {
    label: "Transfer check",
    detail: "Use today’s correction in a fresh context",
    symbol: "↗",
  },
};

function formatProgramDate(dateKey: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T12:00:00.000Z`));
}

const studyMoreOptions = [
  [15, "Quick Practice"],
  [30, "Focused Session"],
  [60, "Deep Study"],
  [90, "Intensive Sprint"],
  [120, "Full Study Block"],
] as const;

function StudyMorePanel() {
  return (
    <section
      className="rounded-[1.75rem] border border-violet/15 bg-violet-soft p-5 sm:p-6"
      aria-labelledby="study-more-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
            Optional extension
          </p>
          <h2 id="study-more-heading" className="mt-1 font-editorial text-3xl">
            Study More
          </h2>
        </div>
        <Button href="/student/study" variant="ghost" size="sm">
          Custom 10–120 min →
        </Button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {studyMoreOptions.map(([minutes, label]) => (
          <Button
            key={minutes}
            href="/student/study"
            variant="secondary"
            className="h-auto min-h-16 flex-col gap-0.5 px-2 text-center"
          >
            <span>{minutes} min</span>
            <span className="text-[0.62rem] font-semibold text-ink-muted">
              {label}
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}

export function TodayDashboard() {
  const {
    hydrated,
    state,
    student,
    metrics,
    programDateKey,
    dueReviewCount,
    prepareNextMission,
    recoveryPass,
    getMilestones,
    celebrateMilestone,
    useLightDay: switchToLightDay,
    useRecoveryPass: applyRecoveryPass,
    setDemoProgramDate,
  } = useStudentDemo();
  const { bundle } = useTutorDemo();

  if (!hydrated || !state || !state.studyPlan || !programDateKey) {
    return null;
  }

  const mission = state.activeMission;
  const daysUntilTest = state.studyPlan.targetTestDate
    ? differenceInDays(state.studyPlan.targetTestDate, programDateKey)
    : null;
  const consistency = buildSevenDayConsistency(
    state.dailyProgress,
    programDateKey,
  );
  const weekPercent = metrics
    ? Math.min(
        100,
        Math.round(
          (metrics.weeklyActiveMinutes /
            Math.max(1, metrics.weeklyGoalMinutes)) *
            100,
        ),
      )
    : 0;
  const todayPercent = Math.min(
    100,
    Math.round(
      ((metrics?.todayActiveMinutes ?? 0) /
        Math.max(1, state.studyPlan.defaultDailyMinutes)) *
        100,
    ),
  );
  const verifiedCorrectionCount =
    bundle?.workspace.diagnosisCases.filter((item) =>
      ["approved", "changed"].includes(item.adjudication.status),
    ).length ?? 0;
  const recentVerified =
    bundle?.workspace.diagnosisCases
      .filter((item) =>
        ["approved", "changed"].includes(item.adjudication.status),
      )
      .slice(0, 2) ?? [];
  const milestone = getMilestones(verifiedCorrectionCount).find(
    (item) => item.achieved && !state.celebratedMilestones.includes(item.id),
  );
  const d2Passed = state.retentionSchedules.some(
    (schedule) => schedule.cadence === "D2" && schedule.outcome === "secure",
  );
  const d7Passed = state.retentionSchedules.some(
    (schedule) => schedule.cadence === "D7" && schedule.outcome === "secure",
  );
  const resolvedPatternCount = state.patterns.filter(
    (pattern) => pattern.status === "resolved",
  ).length;
  const proofSproutStage = getProofSproutStage({
    streak: state.streakStats.current,
    d7Passed,
  });

  if (!mission) {
    return (
      <div>
        <PageHeader
          eyebrow="14-day correction sprint"
          title="Sprint complete"
          description="You reached the end of the local 14-day demo path. Your correction history and pattern map remain available."
          action={<Badge tone="mint">14 / 14 days</Badge>}
        />
        <Card tone="mint" className="mt-8 text-center sm:p-10">
          <p className="text-xs font-bold tracking-[0.14em] text-mint-deep uppercase">
            Retention over volume
          </p>
          <h2 className="mt-4 font-editorial text-4xl">
            Fourteen focused corrections are now traceable.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-ink-muted">
            Review Progress and the Mistake Map to see what became more secure.
            These are practice signals, not an official TOEFL score.
          </p>
          <Button href="/student/progress" className="mt-7">
            Review sprint progress
          </Button>
        </Card>
      </div>
    );
  }

  if (mission.completedAt) {
    const completedAttempts = state.attempts.filter(
      (attempt) => attempt.missionId === mission.id,
    );
    const secureCount = completedAttempts.filter(
      (attempt) => attempt.result === "secure",
    ).length;
    return (
      <div>
        <PageHeader
          eyebrow={`${formatProgramDate(mission.dateKey)} · Day ${mission.dayNumber}`}
          title={
            mission.mode === "weekly-boss"
              ? "Mixed challenge complete"
              : "Correction complete"
          }
          description={
            mission.mode === "weekly-boss"
              ? "The Boss result is saved without changing resolution criteria. Return to the parked daily mission when you are ready."
              : "The work is saved locally. Move to the next demo day when you are ready."
          }
          action={
            <Badge tone="mint">
              Correction Streak · {state.correctionStreak}
            </Badge>
          }
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card tone="mint" className="sm:p-9">
            <p className="text-xs font-bold tracking-[0.14em] text-mint-deep uppercase">
              Day {mission.dayNumber} retained
            </p>
            <h2 className="mt-4 font-editorial text-4xl tracking-tight">
              Daily Core complete. Keep going?
            </h2>
            <p className="mt-4 text-sm leading-6 text-ink-muted">
              {secureCount} secure · {completedAttempts.length - secureCount}{" "}
              still worth watching. A non-secure result schedules a D2 and D7
              return instead of pretending the correction is finished.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => void prepareNextMission()}>
                {mission.mode === "weekly-boss"
                  ? "Return to today’s mission"
                  : `Prepare Day ${Math.min(14, mission.dayNumber + 1)}`}
              </Button>
              <Button href="/student/progress" variant="secondary">
                See progress
              </Button>
              <Button href="/student/study" variant="ghost">
                Study more
              </Button>
            </div>
          </Card>
          <Card tone="violet">
            <p className="text-xs font-bold tracking-wide text-violet uppercase">
              Still independent practice
            </p>
            <p className="mt-4 font-editorial text-2xl">
              This correction signal is not an official TOEFL score.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const completedCount = Object.keys(mission.attemptIdsByEntry).length;
  const missionHref = `/student/practice/${mission.id}` as Route;
  const activeSession = state.studySessions.find(
    (session) =>
      session.id === state.activeSessionId && session.status !== "completed",
  );
  const primaryHref = activeSession
    ? (`/student/study/${activeSession.id}` as Route)
    : missionHref;
  const progressValue = Math.round(
    (completedCount / mission.items.length) * 100,
  );
  const missionParts = (["review", "speed", "thinking", "transfer"] as const)
    .map((part) => {
      const entries = mission.items.filter((item) => item.part === part);
      const complete = entries.filter(
        (entry) => mission.attemptIdsByEntry[entry.entryId],
      ).length;
      return { part, entries, complete };
    })
    .filter(({ entries }) => entries.length > 0);

  return (
    <div>
      <PageHeader
        eyebrow={`${formatProgramDate(programDateKey)} · Day ${mission.dayNumber} of 14`}
        title={`Today, ${student.name.split(" ")[0]}`}
        description={
          daysUntilTest === null
            ? `Your ten-minute Daily Core is ready. Add a test date later if countdown planning becomes useful.`
            : `${Math.max(0, daysUntilTest)} days until your target date. Today’s ten-minute core protects due work before new volume.`
        }
        action={
          <Badge tone="mint">
            Correction Streak · {state.correctionStreak}
          </Badge>
        }
      />

      <section
        className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
        aria-label="Today priorities"
      >
        <Card
          tone="coral"
          className="relative overflow-hidden sm:col-span-2 xl:col-span-2"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.13em] text-coral-deep uppercase">
                Proof Sprout · {proofSproutStageLabels[proofSproutStage]}
              </p>
              <p className="mt-3 font-editorial text-5xl">
                {state.streakStats.current}{" "}
                <span className="text-2xl">days</span>
              </p>
              <p className="mt-2 text-xs leading-5 text-ink-muted">
                Longest {state.streakStats.longest}. Proof Sprout grows only
                from meaningful correction work—opening the app never feeds it.
              </p>
            </div>
            <ProofSprout
              streak={state.streakStats.current}
              d2Passed={d2Passed}
              d7Passed={d7Passed}
              resolvedPatternCount={resolvedPatternCount}
              recoveryPassAvailable={recoveryPass?.available ?? false}
              className="justify-self-end"
            />
          </div>
          <div
            className="mt-4 flex flex-wrap gap-2"
            aria-label="Proof Sprout growth signals"
          >
            <span className="rounded-full border border-violet/15 bg-white/70 px-2.5 py-1 text-[0.65rem] font-bold text-violet-deep">
              {d2Passed ? "D2 leaf earned" : "D2 leaf waiting"}
            </span>
            <span className="rounded-full border border-mint-deep/15 bg-white/70 px-2.5 py-1 text-[0.65rem] font-bold text-mint-deep">
              {d7Passed ? "D7 bloom earned" : "D7 bloom waiting"}
            </span>
            <span className="rounded-full border border-ink/10 bg-white/70 px-2.5 py-1 text-[0.65rem] font-bold text-ink-muted">
              {recoveryPass?.available
                ? "Recovery dew ready"
                : "Recovery dew used"}
            </span>
          </div>
        </Card>
        <Card tone="paper">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold tracking-[0.13em] text-ink-muted uppercase">
              Today’s active study
            </p>
            <span className="text-sm font-bold">{todayPercent}%</span>
          </div>
          <p className="mt-3 font-editorial text-4xl">
            {metrics?.todayActiveMinutes ?? 0}{" "}
            <span className="text-xl">
              / {state.studyPlan.defaultDailyMinutes} min
            </span>
          </p>
          <Progress
            className="mt-4"
            value={todayPercent}
            label="Today active study progress"
            tone="coral"
          />
        </Card>
        <Card tone="violet">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold tracking-[0.13em] text-violet uppercase">
              Weekly active study
            </p>
            <span className="text-sm font-bold">{weekPercent}%</span>
          </div>
          <p className="mt-3 font-editorial text-4xl">
            {metrics?.weeklyActiveMinutes ?? 0}{" "}
            <span className="text-xl">
              /{" "}
              {metrics?.weeklyGoalMinutes ?? state.studyPlan.weeklyGoalMinutes}{" "}
              min
            </span>
          </p>
          <Progress
            className="mt-4"
            value={weekPercent}
            label="Weekly study goal progress"
            tone="violet"
          />
        </Card>
        <Card tone="mint">
          <p className="text-xs font-bold tracking-[0.13em] text-mint-deep uppercase">
            Test-date countdown
          </p>
          <p className="mt-3 font-editorial text-4xl">
            {daysUntilTest === null
              ? "Not set"
              : `${Math.max(0, daysUntilTest)} days`}
          </p>
          <p className="mt-2 text-xs leading-5 text-ink-muted">
            {daysUntilTest === null
              ? "Add a date in Study Plan when it becomes useful."
              : "Planning context only—never an official score forecast."}
          </p>
          <Button
            href="/student/settings"
            variant="ghost"
            size="sm"
            className="mt-3"
          >
            Edit target date
          </Button>
        </Card>
      </section>

      <section
        className="mt-4 rounded-[1.5rem] border border-ink/10 bg-white p-4"
        aria-labelledby="consistency-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="consistency-heading" className="text-sm font-bold">
            Seven-day consistency
          </h2>
          <span className="text-xs text-ink-muted">
            Core complete · study only · missed
          </span>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {consistency.map((day) => (
            <div key={day.dateKey} className="text-center">
              <span
                className={cn(
                  "mx-auto grid size-9 place-items-center rounded-full text-xs font-bold",
                  day.status === "core-complete"
                    ? "bg-mint-deep text-white"
                    : day.status === "study-only"
                      ? "bg-violet text-white"
                      : day.status === "today"
                        ? "border-2 border-coral bg-coral-soft text-coral-deep"
                        : day.status === "missed"
                          ? "bg-ink/8 text-ink-muted"
                          : "border border-ink/8 text-ink-muted",
                )}
                aria-label={`${day.dateKey}: ${day.status.replaceAll("-", " ")}`}
              >
                {day.status === "core-complete" ? "✓" : day.dateKey.slice(-2)}
              </span>
              <span className="mt-1 block text-[0.6rem] font-bold text-ink-muted">
                {new Intl.DateTimeFormat("en", {
                  weekday: "narrow",
                  timeZone: "UTC",
                }).format(new Date(`${day.dateKey}T12:00:00Z`))}
              </span>
            </div>
          ))}
        </div>
      </section>

      {milestone ? (
        <section
          className="mt-6 flex flex-col gap-4 rounded-[1.5rem] border border-mint-deep/20 bg-mint p-5 sm:flex-row sm:items-center sm:justify-between"
          aria-labelledby="milestone-title"
        >
          <div className="flex gap-4">
            <span
              className="grid size-11 shrink-0 place-items-center rounded-full bg-mint-deep font-bold text-white"
              aria-hidden="true"
            >
              ✓
            </span>
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-mint-deep uppercase">
                Milestone reached
              </p>
              <h2 id="milestone-title" className="mt-1 font-editorial text-2xl">
                {milestone.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                {milestone.detail}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void celebrateMilestone(milestone.id)}
          >
            Mark the moment
          </Button>
        </section>
      ) : null}

      {dueReviewCount > 0 ? (
        <section
          className="mt-6 flex flex-col gap-4 rounded-[1.5rem] border border-violet/20 bg-violet-soft p-5 sm:flex-row sm:items-center sm:justify-between"
          aria-labelledby="due-review-heading"
        >
          <div className="flex gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-violet font-editorial font-bold text-white">
              D2
            </span>
            <div>
              <h2 id="due-review-heading" className="font-bold">
                A due review goes first
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                Revisit the evidence correction from your tutor-verified
                baseline before adding new practice.
              </p>
            </div>
          </div>
          <Badge tone="violet">{dueReviewCount} due now</Badge>
        </section>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
        <div className="space-y-5">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-ink/10 bg-coral-soft p-5 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone="coral">
                  {mission.mode === "light" ? "Light Day" : "Today Mission"} ·{" "}
                  {mission.estimatedMinutes} min
                </Badge>
                <span className="text-xs font-bold text-coral-deep">
                  {mission.startedAt
                    ? "Autosaved · Resume ready"
                    : "Ready today"}
                </span>
              </div>
              <h2 className="mt-6 max-w-2xl font-editorial text-4xl leading-[1.02] tracking-[-0.035em] sm:text-5xl">
                {mission.title}
              </h2>
              <p className="mt-4 text-sm leading-6 text-ink-muted">
                Primary mistake target:{" "}
                <strong className="text-ink">
                  {mission.primaryTargetLabel}
                </strong>
              </p>
            </div>

            <div className="p-5 sm:p-8">
              <div className="flex items-center justify-between text-xs font-bold text-ink-muted">
                <span>Mission progress</span>
                <span>
                  {completedCount} / {mission.items.length} items
                </span>
              </div>
              <Progress
                className="mt-3"
                value={progressValue}
                label="Today mission progress"
              />

              <ol className="mt-8 space-y-3">
                {missionParts.map(({ part, entries, complete }) => {
                  const info = partLabels[part];
                  const partComplete = complete === entries.length;
                  const activePart =
                    mission.items[mission.currentIndex]?.part === part;
                  return (
                    <li
                      key={part}
                      className={cn(
                        "flex items-start gap-4 rounded-2xl border p-4 sm:p-5",
                        partComplete
                          ? "border-mint-deep/15 bg-mint"
                          : activePart
                            ? "border-violet/20 bg-violet-soft"
                            : "border-ink/8 bg-cream/45",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold",
                          partComplete
                            ? "bg-mint-deep text-white"
                            : activePart
                              ? "bg-violet text-white"
                              : "bg-ink/7 text-ink-muted",
                        )}
                        aria-hidden="true"
                      >
                        {partComplete ? "✓" : info.symbol}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-bold">{info.label}</h3>
                          <span className="text-[0.65rem] font-bold tracking-wider text-ink-muted uppercase">
                            {complete} / {entries.length}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-ink-muted sm:text-sm">
                          {info.detail}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <Button
                href={primaryHref}
                className="mt-7 w-full sm:w-auto"
                size="lg"
              >
                {activeSession
                  ? "Resume saved study session"
                  : mission.startedAt
                    ? "Resume today’s correction"
                    : "Start today’s correction"}
                <span aria-hidden="true">→</span>
              </Button>
              <Button
                href="/student/study"
                variant="secondary"
                className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto"
                size="lg"
              >
                Study more
              </Button>
              {!mission.startedAt && mission.mode === "standard" ? (
                <button
                  type="button"
                  onClick={() => void switchToLightDay()}
                  className="mt-4 min-h-11 rounded-full px-4 text-sm font-bold text-violet underline decoration-violet/35 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
                >
                  Make today a two-minute Light Day
                </button>
              ) : null}
              <p className="mt-4 text-xs leading-5 text-ink-muted">
                Original practice content — not official ETS material.
              </p>
            </div>
          </Card>
          <StudyMorePanel />
        </div>

        <aside className="space-y-5" aria-label="Today overview">
          <Card>
            <p className="text-xs font-bold tracking-wide text-coral-deep uppercase">
              Recent verified corrections
            </p>
            {recentVerified.length ? (
              <ul className="mt-4 space-y-3">
                {recentVerified.map((item) => (
                  <li key={item.id} className="rounded-2xl bg-cream p-3">
                    <p className="text-sm font-bold">{item.patternLabel}</p>
                    <p className="mt-1 text-xs leading-5 text-ink-muted">
                      {item.adjudication.primaryCause
                        ? item.adjudication.primaryCause.replaceAll("-", " ")
                        : "Tutor-reviewed correction"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                No tutor-verified correction is available yet. Rule observations
                remain visible while review is pending.
              </p>
            )}
          </Card>
          <Card tone="violet">
            <p className="text-xs font-bold tracking-wide text-violet uppercase">
              Recovery Pass
            </p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <p className="font-editorial text-5xl font-bold">
                {recoveryPass?.available ? 1 : 0}
              </p>
              <Badge tone="violet">
                {recoveryPass?.available
                  ? `Week ${recoveryPass.period} available`
                  : "Used"}
              </Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-ink-muted">
              Protects your Correction Streak if one sprint day is missed. It
              does not replace the missed review.
            </p>
            {recoveryPass?.available ? (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4 w-full"
                onClick={() => void applyRecoveryPass()}
              >
                Use for one missed day
              </Button>
            ) : recoveryPass?.protectedDate ? (
              <p className="mt-3 text-xs font-bold text-violet-deep">
                Protected {recoveryPass.protectedDate}
              </p>
            ) : null}
          </Card>

          <Card tone="mint">
            <p className="text-xs font-bold tracking-wide text-mint-deep uppercase">
              Personal pace
            </p>
            <p className="mt-4 font-editorial text-3xl">
              {state.studyPlan.defaultDailyMinutes} minutes
              {state.studyPlan.preferredStudyTime
                ? ` at ${state.studyPlan.preferredStudyTime}`
                : " when ready"}
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-muted capitalize">
              {state.studyPlan.learningStyle.replaceAll("-", " ")} ·{" "}
              {state.studyPlan.readingPriority.replaceAll("-", " ")} priority
            </p>
          </Card>

          <Card>
            <p className="text-xs font-bold tracking-wide text-violet uppercase">
              Sprint map
            </p>
            <p className="mt-3 font-editorial text-2xl">
              See all fourteen days.
            </p>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              Correction, transfer, D2/D7 return, and the two transparent mixed
              challenges.
            </p>
            <Button
              href="/student/sprint"
              variant="secondary"
              size="sm"
              className="mt-5 w-full"
            >
              Open the roadmap
            </Button>
          </Card>

          <Card tone="violet">
            <p className="text-xs font-bold tracking-wide text-violet uppercase">
              Demo clock · demo mode only
            </p>
            <label
              className="mt-4 block text-xs font-bold text-ink-muted"
              htmlFor="demo-program-date"
            >
              Program date
            </label>
            <input
              id="demo-program-date"
              type="date"
              value={programDateKey}
              onChange={(event) => void setDemoProgramDate(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-violet/20 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
            />
            <p className="mt-3 text-xs leading-5 text-ink-muted">
              Use the date to demonstrate due D2/D7 work without waiting.
              Started mission progress is preserved.
            </p>
          </Card>

          <Card>
            <p className="text-xs font-bold tracking-wide text-coral-deep uppercase">
              Practice boundary
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              TraceTutor is independent software, not endorsed by ETS. No signal
              here is an official TOEFL score.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

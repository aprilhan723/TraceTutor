"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useStudentDemo } from "@/components/student/student-demo-provider";
import { differenceInDays } from "@/lib/clock";

export function SprintRoadmap() {
  const {
    hydrated,
    state,
    programDateKey,
    sprintRoadmap,
    recoveryPass,
    getMilestones,
  } = useStudentDemo();
  if (!hydrated || !state?.studyPlan || !programDateKey) return null;
  const daysUntilTest = state.studyPlan.targetTestDate
    ? differenceInDays(state.studyPlan.targetTestDate, programDateKey)
    : null;
  const milestones = getMilestones(2);
  return (
    <div>
      <PageHeader
        eyebrow="14-day correction sprint"
        title="The work has an arc."
        description={`${daysUntilTest === null ? "No test date is set yet" : `${daysUntilTest} days until your target test date`}. This roadmap organizes correction, transfer, and spaced return without rewarding empty volume.`}
        action={
          <Badge tone="mint">
            Correction Streak · {state.correctionStreak}
          </Badge>
        }
      />
      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <Card className="p-5 sm:p-8">
          <ol className="grid gap-3 md:grid-cols-2">
            {sprintRoadmap.map((day) => (
              <li
                key={day.dayNumber}
                className={`relative rounded-2xl border p-4 ${day.status === "complete" ? "border-mint-deep/20 bg-mint" : day.status === "current" ? "border-violet/25 bg-violet-soft" : "border-ink/10 bg-cream/35"}`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold ${day.status === "complete" ? "bg-mint-deep text-white" : day.status === "current" ? "bg-violet text-white" : "bg-ink/7 text-ink-muted"}`}
                  >
                    {day.status === "complete" ? "✓" : day.dayNumber}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold">{day.title}</h2>
                      {day.bossDay ? (
                        <Badge tone="coral">Weekly Boss</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-ink-muted">
                      {day.detail}
                    </p>
                    <p className="mt-2 text-[0.65rem] font-bold tracking-wider text-ink-muted uppercase">
                      {day.dateKey} · {day.status}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <aside
          className="space-y-5"
          aria-label="Sprint safeguards and milestones"
        >
          <Card tone="violet">
            <p className="text-xs font-bold tracking-wide text-violet uppercase">
              Recovery Pass · Week {recoveryPass?.period}
            </p>
            <p className="mt-4 font-editorial text-3xl">
              {recoveryPass?.available ? "1 available" : "Used"}
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              One pass per seven-day period can protect the Correction Streak.
              It never removes due work or pretends practice happened.
            </p>
          </Card>
          <Card>
            <p className="text-xs font-bold tracking-wide text-coral-deep uppercase">
              Milestones that mean something
            </p>
            <ul className="mt-4 space-y-3">
              {milestones.map((milestone) => (
                <li key={milestone.id} className="flex gap-3 text-sm">
                  <span
                    className={
                      milestone.achieved ? "text-mint-deep" : "text-ink-muted"
                    }
                    aria-hidden="true"
                  >
                    {milestone.achieved ? "✓" : "○"}
                  </span>
                  <span>
                    <strong>{milestone.title}</strong>
                    <span className="mt-1 block text-xs leading-5 text-ink-muted">
                      {milestone.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <Button
            href="/student/weekly-boss"
            variant="violet"
            className="w-full"
          >
            Preview the Weekly Boss
          </Button>
          <p className="text-xs leading-5 text-ink-muted">
            Independent practice only. These are learning milestones, not
            official TOEFL score signals.
          </p>
        </aside>
      </div>
    </div>
  );
}

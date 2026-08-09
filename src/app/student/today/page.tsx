import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { demoIds, demoLearningService } from "@/services/learning-service";

export const metadata: Metadata = { title: "Today" };

export default async function StudentTodayPage() {
  const home = await demoLearningService.getStudentHome(demoIds.student);

  if (!home || !home.mission) {
    notFound();
  }

  const { student, mission, patterns } = home;
  const primaryPattern = patterns[0];

  return (
    <div>
      <PageHeader
        eyebrow="Monday · Daily correction sprint"
        title={`Today, ${student.name.split(" ")[0]}`}
        description="One repeating Reading mistake. One focused place to correct it."
        action={
          <Badge tone="mint">
            {student.currentStreakDays}-day trace streak
          </Badge>
        }
      />

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
        <Card className="relative overflow-hidden p-0">
          <div className="border-b border-ink/10 bg-coral-soft p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge tone="coral">
                Today Mission · {mission.estimatedMinutes} min
              </Badge>
              <span className="text-xs font-bold text-coral-deep">
                {mission.dueLabel}
              </span>
            </div>
            <h2 className="mt-6 max-w-2xl font-editorial text-4xl leading-[1.02] tracking-[-0.035em] sm:text-5xl">
              {mission.title}
            </h2>
            <p className="mt-4 text-sm leading-6 text-ink-muted">
              Focus pattern:{" "}
              <strong className="text-ink">{mission.focusLabel}</strong>
            </p>
          </div>

          <div className="p-5 sm:p-8">
            <div className="flex items-center justify-between text-xs font-bold text-ink-muted">
              <span>Mission progress</span>
              <span>{mission.progress}%</span>
            </div>
            <Progress
              className="mt-3"
              value={mission.progress}
              label="Today mission progress"
            />

            <ol className="mt-8 space-y-3">
              {mission.steps.map((step, index) => (
                <li
                  key={step.id}
                  className={`flex items-start gap-4 rounded-2xl border p-4 sm:p-5 ${step.status === "ready" ? "border-violet/20 bg-violet-soft" : "border-ink/8 bg-cream/45"}`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ${step.status === "ready" ? "bg-violet text-white" : "bg-ink/7 text-ink-muted"}`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold">{step.label}</h3>
                      <span className="text-[0.65rem] font-bold tracking-wider text-ink-muted uppercase">
                        {step.status === "ready" ? "Ready" : "Unlocks next"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-ink-muted sm:text-sm">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <Button className="mt-7 w-full sm:w-auto" size="lg" disabled>
              Start mission · Phase 2
            </Button>
            <p className="mt-3 text-xs leading-5 text-ink-muted">
              The interactive correction flow arrives in the next product phase.
            </p>
          </div>
        </Card>

        <div className="space-y-6">
          <Card tone="violet">
            <Badge tone="violet">Why this today</Badge>
            <h2 className="mt-5 font-editorial text-3xl tracking-tight">
              {primaryPattern?.label ?? "Your current pattern"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              {primaryPattern?.description ??
                "Complete a sprint to reveal your first pattern."}
            </p>
            <div className="mt-6 border-t border-violet/15 pt-5">
              <p className="text-xs font-bold tracking-wide text-violet uppercase">
                Tutor note
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                “Show me the sentence before you show me the choice.”
              </p>
            </div>
          </Card>

          <Card tone="mint">
            <p className="text-xs font-bold tracking-wide text-mint-deep uppercase">
              Your target
            </p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="font-editorial text-4xl font-bold">
                  {student.targetScore}
                </p>
                <p className="mt-1 text-xs text-ink-muted">Reading goal</p>
              </div>
              <span className="text-right text-xs leading-5 text-ink-muted">
                Direction only
                <br />
                Not a score prediction
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

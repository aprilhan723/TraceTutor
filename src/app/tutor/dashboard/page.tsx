import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { demoIds, demoLearningService } from "@/services/learning-service";

export const metadata: Metadata = { title: "Tutor Dashboard" };

export default async function TutorDashboardPage() {
  const dashboard = await demoLearningService.getTutorDashboard(demoIds.tutor);

  if (!dashboard) {
    notFound();
  }

  const firstName = dashboard.tutor.name.split(" ")[0];

  return (
    <div>
      <PageHeader
        eyebrow={`Good afternoon, ${firstName}`}
        title="Intervention queue"
        description="The smallest set of student patterns worth a human look before the next lesson."
        action={<Badge tone="mint">Tutor verified · Demo</Badge>}
      />

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <section aria-labelledby="priority-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2
              id="priority-heading"
              className="font-editorial text-2xl font-bold"
            >
              Needs your eye
            </h2>
            <span className="text-xs font-bold text-ink-muted">
              {dashboard.interventions.length} priority
            </span>
          </div>

          {dashboard.interventions.length ? (
            <div className="space-y-4">
              {dashboard.interventions.map((intervention) => (
                <Card key={intervention.id} className="overflow-hidden p-0">
                  <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
                    <div className="flex min-w-0 gap-4">
                      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-mint font-bold text-mint-deep">
                        JP
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold">
                            {intervention.studentName}
                          </h3>
                          <Badge tone="coral">
                            {intervention.priority} priority
                          </Badge>
                        </div>
                        <p className="mt-2 font-editorial text-2xl tracking-tight">
                          {intervention.patternLabel}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-ink-muted">
                          {intervention.reason}
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" disabled>
                      Review workflow coming later
                    </Button>
                  </div>
                  <div className="border-t border-violet/10 bg-violet-soft px-5 py-4 sm:px-7">
                    <p className="text-xs font-bold tracking-wide text-violet uppercase">
                      Suggested next move
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">
                      {intervention.suggestedAction}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="The queue is clear"
              description="No repeated pattern currently needs tutor review."
            />
          )}
        </section>

        <aside className="space-y-5" aria-label="Tutor overview">
          <Card tone="violet">
            <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
              Active students
            </p>
            <p className="mt-4 font-editorial text-5xl font-bold">
              {dashboard.students.length}
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              in this local demo workspace
            </p>
          </Card>
          <Card tone="mint">
            <p className="text-xs font-bold tracking-[0.14em] text-mint-deep uppercase">
              Workflow promise
            </p>
            <p className="mt-4 font-editorial text-2xl leading-tight">
              See why a student is stuck before the next lesson.
            </p>
          </Card>
          <Card>
            <p className="text-sm leading-6 text-ink-muted">
              TraceTutor signals are instructional evidence only. They are not
              official TOEFL scores or score predictions.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

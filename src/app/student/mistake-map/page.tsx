import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { demoIds, demoLearningService } from "@/services/learning-service";

export const metadata: Metadata = { title: "Mistake Map" };

export default async function MistakeMapPage() {
  const home = await demoLearningService.getStudentHome(demoIds.student);

  if (!home) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Pattern memory"
        title="Mistake Map"
        description="A living map of why misses happen, where they repeat, and which correction is beginning to stick."
        action={<Badge tone="violet">Preview</Badge>}
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {home.patterns.map((pattern, index) => (
          <Card key={pattern.id} tone={index === 0 ? "violet" : "mint"}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.13em] text-ink-muted uppercase">
                  Pattern {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 font-editorial text-3xl tracking-tight">
                  {pattern.label}
                </h2>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white font-editorial text-xl font-bold shadow-sm">
                {pattern.recurrenceCount}×
              </span>
            </div>
            <p className="mt-5 text-sm leading-6 text-ink-muted">
              {pattern.description}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-5 text-xs font-bold">
              <span className="capitalize">
                {pattern.trend.replace("-", " ")}
              </span>
              <span className="text-ink-muted">
                Detailed trace arrives in Phase 2
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-5 border-dashed text-center">
        <p className="font-editorial text-2xl">
          The map grows from corrected evidence—not raw wrong-answer counts.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
          Future sprints will connect each pattern to task type, evidence
          behavior, tutor verification, and retention checks.
        </p>
      </Card>
    </div>
  );
}

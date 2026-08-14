"use client";

import { useRouter } from "next/navigation";
import { getPracticeItem } from "@/data/practice-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useStudentDemo } from "@/components/student/student-demo-provider";
import {
  distractorRelationLabels,
  errorCauseLabels,
} from "@/domain/mistake-intelligence";

export function WeeklyBoss() {
  const router = useRouter();
  const { hydrated, weeklyBoss, startWeeklyBoss } = useStudentDemo();
  if (!hydrated || !weeklyBoss) return null;
  async function start() {
    const next = await startWeeklyBoss();
    if (next?.activeMission)
      router.push(`/student/practice/${next.activeMission.id}`);
  }
  return (
    <div>
      <PageHeader
        eyebrow={`Week ${weeklyBoss.weekNumber} mixed challenge`}
        title={weeklyBoss.theme}
        description="A mature mixed challenge built from the option relationships and correction causes that recur most often in the current trace."
        action={<Badge tone="coral">≈ 8 minutes</Badge>}
      />
      <div className="mt-8 grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <Card
          tone="violet"
          className="relative min-h-80 overflow-hidden sm:p-9"
        >
          <div className="hydra-trace" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="relative text-xs font-bold tracking-[0.14em] text-violet uppercase">
            Why this mix
          </p>
          <h2 className="relative mt-4 font-editorial text-4xl">
            Half true is still not proved.
          </h2>
          <p className="relative mt-4 text-sm leading-6 text-ink-muted">
            The theme is an original geometric metaphor, not a mascot. Each
            “head” is an attractive relation worth checking against exact
            evidence.
          </p>
          <div className="relative mt-6 flex flex-wrap gap-2">
            {weeklyBoss.topRelations.map((relation) => (
              <Badge key={relation} tone="violet">
                {distractorRelationLabels[relation]}
              </Badge>
            ))}
            {weeklyBoss.topCauses.map((cause) => (
              <Badge key={cause} tone="neutral">
                {errorCauseLabels[cause]}
              </Badge>
            ))}
          </div>
        </Card>
        <Card className="sm:p-8">
          <h2 className="font-editorial text-3xl">
            Four choices, each with a reason.
          </h2>
          <ol className="mt-6 space-y-3">
            {weeklyBoss.itemReasons.map((entry, index) => {
              const item = getPracticeItem(entry.itemId);
              return (
                <li
                  key={entry.itemId}
                  className="rounded-2xl border border-ink/10 bg-cream/40 p-4"
                >
                  <div className="flex gap-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-coral-soft text-xs font-bold text-coral-deep">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold">
                        {item?.title ?? "Mixed correction item"}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-ink-muted">
                        {entry.reason}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-6 rounded-2xl border border-mint-deep/15 bg-mint p-4">
            <p className="text-sm font-bold text-mint-deep">
              Resolution safeguard
            </p>
            <p className="mt-1 text-xs leading-5 text-ink-muted">
              Completing or passing this Boss never resolves a pattern by
              itself. Distinct transfer and 2-day/7-day retention criteria still
              apply.
            </p>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button onClick={start}>
              Start the mixed challenge <span aria-hidden="true">→</span>
            </Button>
            <Button href="/student/sprint" variant="secondary">
              View sprint roadmap
            </Button>
          </div>
          <p className="mt-5 text-xs leading-5 text-ink-muted">
            Original practice content — not official ETS material.
          </p>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useStudentDemo } from "@/components/student/student-demo-provider";
import { useTutorDemo } from "@/components/tutor/tutor-demo-provider";
import { Button } from "@/components/ui/button";
import type { PatternStatus } from "@/domain/study";
import {
  errorCauseLabels,
  processStageLabels,
} from "@/domain/mistake-intelligence";

const statusCopy: Record<
  PatternStatus,
  {
    label: string;
    detail: string;
    tone: "neutral" | "coral" | "violet" | "mint";
  }
> = {
  new: {
    label: "New",
    detail: "Seen once; watch before calling it a stable pattern.",
    tone: "neutral",
  },
  working: {
    label: "Working",
    detail: "The correction is active and needs deliberate practice.",
    tone: "coral",
  },
  unstable: {
    label: "Unstable",
    detail: "Some answers land, but confidence or evidence is not reliable.",
    tone: "violet",
  },
  improving: {
    label: "Improving",
    detail: "Secure attempts are beginning to repeat.",
    tone: "mint",
  },
  resolved: {
    label: "Resolved",
    detail: "The correction held across repeated returns.",
    tone: "mint",
  },
  recurring: {
    label: "Recurring",
    detail:
      "The pattern returned after improvement and is queued for tutor review.",
    tone: "coral",
  },
};

const retentionLabels = {
  immediate: "Immediate",
  d2: "Day 2",
  d7: "Day 7",
} as const;

const retentionOutcomeCopy = {
  "not-scheduled": "Not scheduled",
  scheduled: "Scheduled",
  secure: "Secure",
  "needs-work": "Needs work",
} as const;

export function MistakeMapDashboard() {
  const { hydrated, state, vecr7 } = useStudentDemo();
  const { bundle } = useTutorDemo();
  if (!hydrated || !state?.studyPlan) {
    return null;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Pattern memory · Live local data"
        title="Mistake Map"
        description="A living map of why misses happen, where they repeat, and which correction is beginning to hold."
        action={
          <Badge tone="violet">{state.patterns.length} patterns traced</Badge>
        }
      />

      <Card tone="violet" className="mt-8 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.13em] text-violet uppercase">
              VECR-7 · Verified error correction retention
            </p>
            <p className="mt-3 font-editorial text-4xl">
              {vecr7?.rate === null ? "Not eligible yet" : `${vecr7?.rate}%`}
            </p>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-muted">
            {vecr7?.rate === null
              ? "VECR-7 waits until at least one diagnosis reaches a real Day 7 opportunity. Early attempts never inflate the denominator."
              : `${vecr7?.retainedDiagnoses} of ${vecr7?.eligibleDiagnoses} eligible diagnoses held on Day 7.`}
          </p>
        </div>
      </Card>

      {bundle ? (
        <Card tone="mint" className="mt-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.13em] text-mint-deep uppercase">
                Tutor verification
              </p>
              <p className="mt-2 font-editorial text-2xl font-bold">
                {
                  bundle.workspace.diagnosisCases.filter((item) =>
                    ["approved", "changed"].includes(item.adjudication.status),
                  ).length
                }{" "}
                corrections reviewed
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Tutor decisions stay separate from the original rule suggestion
                and appear in your weekly summary.
              </p>
            </div>
            <Button href="/student/weekly-report" variant="secondary">
              Open weekly report →
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {state.patterns.map((pattern, index) => {
          const status = statusCopy[pattern.status];
          return (
            <Card
              key={pattern.id}
              tone={
                pattern.status === "improving" || pattern.status === "resolved"
                  ? "mint"
                  : index === 0
                    ? "violet"
                    : "paper"
              }
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-[0.13em] text-ink-muted uppercase">
                    Pattern {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-3 font-editorial text-3xl tracking-tight">
                    {pattern.label}
                  </h2>
                </div>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
              <p className="mt-5 text-sm leading-6 text-ink-muted">
                {pattern.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {pattern.errorCause ? (
                  <Badge tone="violet">
                    Cause · {errorCauseLabels[pattern.errorCause]}
                  </Badge>
                ) : null}
                {pattern.processStage ? (
                  <Badge tone="neutral">
                    Stage · {processStageLabels[pattern.processStage]}
                  </Badge>
                ) : null}
                {pattern.tutorReviewRequired ? (
                  <Badge tone="coral">Tutor review</Badge>
                ) : (
                  <Badge tone="mint">Rule-monitored</Badge>
                )}
              </div>
              <div className="mt-6 rounded-2xl bg-white/70 p-4">
                <p className="text-xs font-bold tracking-wide text-violet uppercase">
                  What this status means
                </p>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  {status.detail}
                </p>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {(
                  Object.entries(pattern.retention) as Array<
                    [
                      keyof typeof retentionLabels,
                      (typeof pattern.retention)[keyof typeof pattern.retention],
                    ]
                  >
                ).map(([cadence, retention]) => (
                  <div
                    key={cadence}
                    className="rounded-xl border border-ink/10 bg-white/70 p-3"
                  >
                    <p className="text-[0.65rem] font-bold tracking-wide text-ink-muted uppercase">
                      {retentionLabels[cadence]}
                    </p>
                    <p className="mt-1 text-xs font-bold">
                      {retentionOutcomeCopy[retention.outcome]}
                    </p>
                    {retention.dueDate ? (
                      <p className="mt-1 text-[0.65rem] text-ink-muted">
                        {retention.dueDate}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
              {pattern.recentEvidence.length > 0 ? (
                <div className="mt-5 border-t border-ink/10 pt-5">
                  <p className="text-xs font-bold tracking-wide text-violet uppercase">
                    Recent observable evidence
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-muted">
                    {pattern.recentEvidence.slice(0, 2).map((evidence) => (
                      <li key={`${evidence.attemptId}-${evidence.observedAt}`}>
                        • {evidence.summary}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-ink/10 pt-5">
                <div>
                  <p className="font-editorial text-3xl font-bold">
                    {pattern.recurrenceCount}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">times noticed</p>
                </div>
                <div>
                  <p className="font-editorial text-3xl font-bold">
                    {pattern.secureCount}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">secure returns</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-5 border-dashed text-center">
        <p className="font-editorial text-2xl">
          Status changes come from answer, confidence, and evidence behavior
          together.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
          TraceTutor does not claim to know why you thought something. It
          records the observable trace and leaves deeper interpretation to you
          and your tutor.
        </p>
      </Card>
    </div>
  );
}

"use client";

import type { Route } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useTutorDemo } from "@/components/tutor/tutor-demo-provider";

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
  const { hydrated, bundle } = useTutorDemo();
  if (!hydrated || !bundle) return <LoadingDashboard />;

  const { dashboard } = bundle;
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

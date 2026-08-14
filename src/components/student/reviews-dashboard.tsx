"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useStudentDemo } from "@/components/student/student-demo-provider";

export function ReviewsDashboard() {
  const router = useRouter();
  const { hydrated, state, programDateKey, startPersonalizedSession } =
    useStudentDemo();
  const [starting, setStarting] = useState(false);
  if (!hydrated || !state || !programDateKey)
    return (
      <Card
        className="h-64 animate-pulse motion-reduce:animate-none"
        aria-label="Loading reviews"
      />
    );
  const retention = state.retentionSchedules.filter(
    (entry) =>
      entry.cadence !== "immediate" &&
      !entry.completedAt &&
      entry.dueDate <= programDateKey,
  );
  const legacy = state.reviewSchedules.filter(
    (entry) => !entry.completedAt && entry.dueDate <= programDateKey,
  );
  const due = [
    ...retention.map((entry) => ({
      id: entry.id,
      cadence: entry.cadence,
      dueDate: entry.dueDate,
      itemId: entry.itemId,
      kind: "Verified diagnosis",
    })),
    ...legacy.map((entry) => ({
      id: entry.id,
      cadence: entry.cadence,
      dueDate: entry.dueDate,
      itemId: entry.itemId,
      kind: "Scheduled correction",
    })),
  ];

  async function startReviews() {
    setStarting(true);
    const next = await startPersonalizedSession({
      minutes: 15,
      topic: "due-reviews",
      includeDueReviews: true,
      timed: false,
    });
    if (next?.activeSessionId)
      router.push(`/student/study/${next.activeSessionId}`);
    setStarting(false);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Retention queue"
        title="Reviews"
        description="Reviews scheduled 2 and 7 days after a correction come before new volume. Passing one strengthens the trace; it does not create an official score claim."
        action={
          due.length ? (
            <Button onClick={() => void startReviews()} disabled={starting}>
              {starting ? "Preparing…" : "Start due reviews"}
            </Button>
          ) : undefined
        }
      />
      {due.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            title="Nothing is due right now"
            description="New reviews appear only after a correction creates a meaningful return date."
            action={<Button href="/student/study">Study a focused set</Button>}
          />
        </div>
      ) : (
        <div className="mt-7 grid gap-3">
          {due.map((entry) => (
            <Card
              key={entry.id}
              className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={entry.cadence === "D7" ? "coral" : "violet"}>
                    {entry.cadence === "D2" ? "2-day review" : "7-day review"}
                  </Badge>
                  <Badge>{entry.kind}</Badge>
                </div>
                <h2 className="mt-3 font-editorial text-2xl">
                  Return to {entry.itemId}
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Due {entry.dueDate} · Scheduled from prior observable work
                </p>
              </div>
              <span className="text-sm font-bold text-violet">
                Due before new practice
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

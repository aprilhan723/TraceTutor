"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStudentDemo } from "@/components/student/student-demo-provider";
import { shouldAccumulateActiveTime } from "@/services/active-time";
import { cn } from "@/lib/cn";

export function StudySessionView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const {
    hydrated,
    state,
    metrics,
    programDateKey,
    continueStudySession,
    pauseStudySession,
    recordSessionActiveTime,
    endStudySessionAfterBlock,
  } = useStudentDemo();
  const [busy, setBusy] = useState(false);
  const lastInteraction = useRef(0);
  const saving = useRef(false);

  const session = state?.studySessions.find(
    (candidate) => candidate.id === sessionId,
  );
  useEffect(() => {
    lastInteraction.current = Date.now();
    const active = () => {
      lastInteraction.current = Date.now();
    };
    window.addEventListener("pointerdown", active, { passive: true });
    window.addEventListener("keydown", active);
    const interval = window.setInterval(() => {
      if (!session || saving.current) return;
      if (
        !shouldAccumulateActiveTime({
          sessionStatus: session.status,
          documentVisible: document.visibilityState === "visible",
          nowMs: Date.now(),
          lastInteractionMs: lastInteraction.current,
        })
      )
        return;
      saving.current = true;
      void recordSessionActiveTime(session.id, 15).finally(() => {
        saving.current = false;
      });
    }, 15_000);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pointerdown", active);
      window.removeEventListener("keydown", active);
    };
  }, [recordSessionActiveTime, session]);

  if (!hydrated)
    return (
      <Card
        className="h-80 animate-pulse motion-reduce:animate-none"
        aria-label="Loading session"
      />
    );
  if (!session || !state)
    return (
      <Card>
        <h1 className="font-editorial text-3xl">Session not found</h1>
        <p className="mt-3 text-sm text-ink-muted">
          This local session may have been reset.
        </p>
        <Button href="/student/study" className="mt-5">
          Build another session
        </Button>
      </Card>
    );
  const selectedSession = session;
  const completedBlocks = selectedSession.blocks.filter(
    (block) => block.status === "completed",
  ).length;
  const currentBlock = selectedSession.blocks.find(
    (block) => block.status === "active",
  );
  const nextUpcoming = selectedSession.blocks.find(
    (block) => block.status === "upcoming",
  );
  const lastCompleted = [...selectedSession.blocks]
    .reverse()
    .find((block) => block.status === "completed");
  const mission =
    state.activeMission?.sessionId === selectedSession.id
      ? state.activeMission
      : null;
  const complete = selectedSession.status === "completed";

  async function continueSession() {
    setBusy(true);
    if (
      selectedSession.status === "active" &&
      currentBlock?.status === "active" &&
      currentBlock.missionEntryIds.some(
        (entryId) => !mission?.attemptIdsByEntry[entryId],
      ) &&
      mission
    ) {
      router.push(`/student/practice/${mission.id}`);
      setBusy(false);
      return;
    }
    const next = await continueStudySession(selectedSession.id);
    if (next?.activeMission && !next.activeMission.completedAt)
      router.push(`/student/practice/${next.activeMission.id}`);
    setBusy(false);
  }

  async function pauseAndLeave() {
    await pauseStudySession(selectedSession.id);
    router.push("/student/today");
  }

  if (complete) {
    const rate =
      session.questionsAnswered === 0
        ? null
        : Math.round(
            (session.correctAnswers / session.questionsAnswered) * 100,
          );
    const missionAttempts = state.attempts.filter(
      (attempt) => attempt.missionId === state.activeMission?.id,
    );
    const newlyIdentified = missionAttempts.filter(
      (attempt) => attempt.result === "diagnose",
    ).length;
    const improving = state.patterns.filter(
      (pattern) => pattern.status === "improving",
    ).length;
    const nextReview = state.retentionSchedules
      .filter((review) => !review.completedAt)
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0];
    const dailyCoreComplete = state.dailyProgress.some(
      (entry) => entry.localDate === programDateKey && entry.dailyCoreCompleted,
    );
    return (
      <div>
        <Card tone="mint" className="p-7 sm:p-10">
          <Badge tone="mint">Session saved</Badge>
          <h1 className="mt-4 font-editorial text-5xl">Good stopping point.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
            Completed work stays in your learning trace. The planner will return
            unresolved work through transfer, D2, or D7—not by pretending today
            solved everything.
          </p>
          <dl className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryStat
              label="Active time"
              value={`${Math.round(session.activeSeconds / 60)} / ${session.plannedMinutes} min`}
            />
            <SummaryStat
              label="Questions"
              value={String(session.questionsAnswered)}
            />
            <SummaryStat
              label="Accuracy"
              value={rate === null ? "Not enough data" : `${rate}%`}
            />
            <SummaryStat
              label="Due reviews"
              value={String(session.dueReviewsCompleted)}
            />
            <SummaryStat
              label="Transfer items"
              value={String(session.transferItemsCompleted)}
            />
            <SummaryStat
              label="Diagnostic loops"
              value={String(session.diagnosticLoopsCompleted)}
            />
            <SummaryStat
              label="Newly identified"
              value={String(newlyIdentified)}
            />
          </dl>
          <div className="mt-6 rounded-3xl border border-mint-deep/15 bg-white/70 p-5 text-sm leading-6 text-ink-muted">
            <p className="font-bold text-ink">
              {dailyCoreComplete
                ? `Daily Core complete · Correction Streak ${state.streakStats.current}`
                : "Daily Core is still available today"}
            </p>
            <p className="mt-2">
              {improving > 0
                ? `${improving} pattern${improving === 1 ? " is" : "s are"} showing verified improvement. `
                : "No pattern is marked improved without transfer and retention evidence. "}
              {nextReview
                ? `Next ${nextReview.cadence} check: ${nextReview.dueDate}.`
                : "No D2 or D7 return is scheduled yet."}
            </p>
            <p className="mt-2">
              Weekly goal: {metrics?.weeklyActiveMinutes ?? 0} /{" "}
              {metrics?.weeklyGoalMinutes ??
                state.studyPlan?.weeklyGoalMinutes ??
                0}{" "}
              active minutes.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/student/today">Return home</Button>
            <Button href="/student/progress" variant="secondary">
              See progress
            </Button>
            <Button href="/student/study" variant="ghost">
              Study more
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const blockDone =
    !currentBlock ||
    currentBlock.missionEntryIds.every(
      (entryId) => mission?.attemptIdsByEntry[entryId],
    );
  return (
    <div>
      <header className="border-b border-ink/10 pb-7">
        <Badge tone={session.timed ? "coral" : "violet"}>
          {session.timed ? "Timed plan" : "Personalized plan"}
        </Badge>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-editorial text-4xl sm:text-5xl">
              {session.plannedMinutes}-minute study session
            </h1>
            <p className="mt-3 text-sm text-ink-muted">
              {session.availableMinutes} minutes available ·{" "}
              {Math.round(session.activeSeconds / 60)} active minutes recorded
            </p>
          </div>
          <Button variant="ghost" onClick={() => void pauseAndLeave()}>
            Pause and leave
          </Button>
        </div>
        <Progress
          className="mt-6"
          value={(completedBlocks / session.blocks.length) * 100}
          label="Study session block progress"
          tone="violet"
        />
      </header>
      {session.contentShortage ? (
        <Card tone="coral" className="mt-6">
          <p className="text-sm font-bold">Honest content limit</p>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {session.shortageMessage}
          </p>
        </Card>
      ) : null}
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3" aria-label="Study blocks">
          {session.blocks.map((block, index) => (
            <div
              key={block.id}
              className={cn(
                "rounded-3xl border p-5",
                block.status === "active"
                  ? "border-violet bg-violet-soft"
                  : block.status === "completed"
                    ? "bg-mint-soft border-mint-deep/15"
                    : block.status === "skipped"
                      ? "border-ink/5 bg-ink/3 opacity-65"
                      : "border-ink/10 bg-white",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
                    Block {index + 1} · {block.estimatedMinutes} min
                  </p>
                  <h2 className="mt-2 font-editorial text-2xl">
                    {block.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {block.detail}
                  </p>
                </div>
                <Badge
                  tone={
                    block.status === "completed"
                      ? "mint"
                      : block.status === "active"
                        ? "violet"
                        : "neutral"
                  }
                >
                  {block.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card tone="violet">
            <p className="text-xs font-bold tracking-[0.13em] text-violet uppercase">
              Next move
            </p>
            <h2 className="mt-3 font-editorial text-3xl">
              {blockDone
                ? (nextUpcoming?.title ?? "Continue when ready")
                : (currentBlock?.title ?? "Session plan")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              {blockDone && nextUpcoming?.activityType === "break"
                ? `Take the recommended ${nextUpcoming.breakMinutes}-minute break. Your completed work is already saved.`
                : blockDone
                  ? (nextUpcoming?.detail ??
                    "Your completed work is saved. Continue when you are ready.")
                  : currentBlock?.detail}
            </p>
            <Button
              className="mt-5 w-full"
              onClick={() => void continueSession()}
              disabled={busy}
            >
              {busy
                ? "Opening…"
                : blockDone
                  ? "Continue to next block"
                  : "Open current block"}
              <span aria-hidden="true">→</span>
            </Button>
          </Card>
          {lastCompleted ? (
            <Button
              className="w-full"
              variant="secondary"
              onClick={() =>
                void endStudySessionAfterBlock(session.id, lastCompleted.id)
              }
            >
              End after completed block
            </Button>
          ) : null}
          <p className="text-xs leading-5 text-ink-muted">
            Active time pauses when this session is paused, the tab is hidden,
            or there has been no interaction for 90 seconds.
          </p>
        </aside>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <dt className="text-xs font-bold tracking-wide text-ink-muted uppercase">
        {label}
      </dt>
      <dd className="mt-2 font-editorial text-3xl">{value}</dd>
    </div>
  );
}

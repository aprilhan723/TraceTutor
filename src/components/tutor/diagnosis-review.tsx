"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTutorDemo } from "@/components/tutor/tutor-demo-provider";
import {
  errorCauseLabels,
  errorCauseTaxonomy,
  type ErrorCause,
} from "@/domain/mistake-intelligence";
import { cn } from "@/lib/cn";

export function DiagnosisReview({ caseId }: { caseId: string }) {
  const { hydrated, bundle, adjudicate } = useTutorDemo();
  const detail = bundle?.caseDetails.find(
    (candidate) => candidate.case.id === caseId,
  );
  const [secondaryCause, setSecondaryCause] =
    useState<ErrorCause>("evidence-misread");
  const [transferItemId, setTransferItemId] = useState("");
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!hydrated) {
    return (
      <div
        className="h-96 animate-pulse rounded-[2rem] bg-white motion-reduce:animate-none"
        aria-label="Loading diagnosis review"
      />
    );
  }
  if (!detail || !bundle) {
    return (
      <Card>
        <h1 className="font-editorial text-3xl">Diagnosis not found</h1>
        <Button href="/tutor/dashboard" variant="secondary" className="mt-5">
          Back to queue
        </Button>
      </Card>
    );
  }

  const item = detail.case;
  const adjudication = item.adjudication;
  const primary =
    adjudication.primaryCause ?? item.machineSuggestion.primaryCause;
  const secondary = adjudication.secondaryCauses.length
    ? adjudication.secondaryCauses
    : item.machineSuggestion.secondaryCauses;
  const selectedTransferItemId =
    transferItemId ||
    adjudication.assignedTransferItemId ||
    detail.transferChoices[0]?.id ||
    "";
  const followUpValue = followUp ?? adjudication.followUpQuestion ?? "";
  const feedbackValue = feedback ?? adjudication.feedback ?? "";

  async function act(command: Parameters<typeof adjudicate>[1]) {
    setBusy(true);
    await adjudicate(caseId, command);
    setBusy(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-5">
        <Link
          href="/tutor/dashboard"
          className="rounded-full px-3 py-2 text-sm font-bold text-ink-muted hover:bg-white focus-visible:outline-2 focus-visible:outline-violet"
        >
          ← Today’s queue
        </Link>
        <div className="flex flex-wrap gap-2">
          <Badge
            tone={
              adjudication.status === "approved" ||
              adjudication.status === "changed"
                ? "mint"
                : adjudication.status === "ambiguous"
                  ? "coral"
                  : "violet"
            }
          >
            {adjudication.status.replace("-", " ")}
          </Badge>
          <Badge tone="neutral">
            Rule confidence{" "}
            {Math.round(item.machineSuggestion.confidence * 100)}%
          </Badge>
        </div>
      </div>

      <header className="mt-7 max-w-4xl">
        <p className="text-xs font-bold tracking-[0.15em] text-violet uppercase">
          Diagnosis review · {bundle.students[0]?.name}
        </p>
        <h1 className="mt-2 font-editorial text-4xl leading-tight tracking-[-0.035em] sm:text-5xl">
          {detail.itemTitle}
        </h1>
        <p className="mt-3 text-base leading-7 text-ink-muted">
          {detail.prompt}
        </p>
      </header>

      <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.65fr)]">
        <div className="space-y-6">
          {detail.stimulusSegments.length ? (
            <Card>
              <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
                Original stimulus
              </p>
              <h2 className="mt-2 font-editorial text-2xl font-bold">
                {detail.stimulusTitle}
              </h2>
              <div className="mt-5 space-y-2">
                {detail.stimulusSegments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-sm leading-6",
                      segment.designated
                        ? "border-mint-deep/25 bg-mint"
                        : segment.selected
                          ? "border-coral/30 bg-coral-soft"
                          : "border-ink/10 bg-cream/50",
                    )}
                  >
                    <div className="mb-1 flex flex-wrap gap-2 text-[0.65rem] font-bold tracking-wide uppercase">
                      <span>Segment {index + 1}</span>
                      {segment.selected ? (
                        <span className="text-coral-deep">
                          Student evidence
                        </span>
                      ) : null}
                      {segment.designated ? (
                        <span className="text-mint-deep">
                          Designated evidence
                        </span>
                      ) : null}
                    </div>
                    {segment.text}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-editorial text-2xl font-bold">
                Answer trace
              </h2>
              <Badge
                tone={
                  item.attempt.confidence === "certain" ? "coral" : "neutral"
                }
              >
                {item.attempt.confidence ?? "typed response"}
              </Badge>
            </div>
            <div className="mt-4 grid gap-2">
              {detail.options.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm",
                    option.correct
                      ? "border-mint-deep/25 bg-mint"
                      : option.selected
                        ? "border-coral/30 bg-coral-soft"
                        : "border-ink/10",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong>{option.id.toUpperCase()}.</strong> {option.label}
                    </span>
                    <span className="text-xs font-bold uppercase">
                      {option.correct
                        ? "Correct"
                        : option.selected
                          ? "Selected"
                          : "Not selected"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <dl className="mt-5 grid gap-3 border-t border-ink/10 pt-5 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs font-bold text-ink-muted uppercase">
                  Time
                </dt>
                <dd className="mt-1 font-bold">
                  {item.attempt.elapsedSeconds}s
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-ink-muted uppercase">
                  Answer changes
                </dt>
                <dd className="mt-1 font-bold">{item.attempt.answerChanges}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-ink-muted uppercase">
                  Result
                </dt>
                <dd className="mt-1 font-bold capitalize">
                  {item.attempt.result}
                </dd>
              </div>
            </dl>
          </Card>

          <Card tone="violet">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
                  Original machine suggestion
                </p>
                <h2 className="mt-2 font-editorial text-2xl font-bold">
                  Likely:{" "}
                  {item.machineSuggestion.primaryCause
                    ? errorCauseLabels[item.machineSuggestion.primaryCause]
                    : "No primary cause"}
                </h2>
              </div>
              <Badge tone="neutral">Preserved snapshot</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              This record never changes when the tutor adjudicates it. The
              suggestion is rule-first evidence, not psychological truth.
            </p>
            <h3 className="mt-5 text-xs font-bold tracking-wide text-violet uppercase">
              Rule observations
            </h3>
            <ul className="mt-3 space-y-2">
              {item.machineSuggestion.observations.map((observation) => (
                <li
                  key={observation.code}
                  className="rounded-xl bg-white/70 p-3 text-sm leading-6"
                >
                  <strong>{observation.label}.</strong> {observation.detail}
                </li>
              ))}
            </ul>
            {item.probe ? (
              <div className="mt-5 rounded-xl border border-violet/15 bg-white/70 p-4">
                <p className="text-xs font-bold text-violet uppercase">
                  Student probe answer
                </p>
                <p className="mt-2 text-sm font-bold">
                  {item.probe.selectedAnswer}
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  {item.probe.interpretation}
                </p>
              </div>
            ) : null}
          </Card>

          <Card>
            <h2 className="font-editorial text-2xl font-bold">
              Transfer and retention
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {item.retentionHistory.map((review) => (
                <div
                  key={`${review.cadence}-${review.itemId}`}
                  className="rounded-xl border border-ink/10 p-4"
                >
                  <p className="text-xs font-bold uppercase">
                    {review.cadence === "immediate"
                      ? "Immediate"
                      : `Day ${review.cadence.slice(1)}`}
                  </p>
                  <p className="mt-2 font-bold capitalize">
                    {review.outcome.replace("-", " ")}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {review.dueDate}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-5" aria-label="Tutor adjudication actions">
          <Card>
            <p className="text-xs font-bold tracking-[0.14em] text-coral-deep uppercase">
              Tutor adjudication
            </p>
            <h2 className="mt-2 font-editorial text-3xl font-bold">
              Make the human call
            </h2>

            <label
              className="mt-5 block text-xs font-bold uppercase"
              htmlFor="primary-cause"
            >
              Primary cause
            </label>
            <select
              id="primary-cause"
              value={primary ?? ""}
              onChange={(event) =>
                void act({
                  type: "change-primary",
                  cause: event.target.value as ErrorCause,
                })
              }
              disabled={busy}
              className="mt-2 min-h-12 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-violet"
            >
              {errorCauseTaxonomy.map((cause) => (
                <option key={cause} value={cause}>
                  {errorCauseLabels[cause]}
                </option>
              ))}
            </select>

            <div className="mt-5">
              <p className="text-xs font-bold uppercase">
                Alternate hypotheses
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {secondary.map((cause) => (
                  <button
                    key={cause}
                    type="button"
                    onClick={() =>
                      void act({ type: "remove-secondary", cause })
                    }
                    className="min-h-9 rounded-full bg-violet-soft px-3 text-xs font-bold text-violet-deep focus-visible:outline-2 focus-visible:outline-violet"
                    aria-label={`Remove ${errorCauseLabels[cause]} alternate cause`}
                  >
                    {errorCauseLabels[cause]} ×
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <select
                  aria-label="Secondary cause"
                  value={secondaryCause}
                  onChange={(event) =>
                    setSecondaryCause(event.target.value as ErrorCause)
                  }
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-2 text-xs"
                >
                  {errorCauseTaxonomy
                    .filter((cause) => cause !== primary)
                    .map((cause) => (
                      <option key={cause} value={cause}>
                        {errorCauseLabels[cause]}
                      </option>
                    ))}
                </select>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    void act({ type: "add-secondary", cause: secondaryCause })
                  }
                  disabled={busy}
                >
                  Add
                </Button>
              </div>
            </div>

            <Button
              className="mt-5 w-full"
              variant="violet"
              onClick={() => void act({ type: "approve" })}
              disabled={busy}
            >
              Approve diagnosis
            </Button>

            <div className="mt-6 border-t border-ink/10 pt-5">
              <label
                htmlFor="transfer-item"
                className="text-xs font-bold uppercase"
              >
                Different transfer item
              </label>
              <select
                id="transfer-item"
                value={selectedTransferItemId}
                onChange={(event) => setTransferItemId(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm"
              >
                {detail.transferChoices.map((choice) => (
                  <option key={choice.id} value={choice.id}>
                    {choice.label}
                  </option>
                ))}
              </select>
              <Button
                className="mt-2 w-full"
                size="sm"
                variant="secondary"
                onClick={() =>
                  void act({
                    type: "assign-transfer",
                    itemId: selectedTransferItemId,
                  })
                }
                disabled={!selectedTransferItemId || busy}
              >
                Assign transfer
              </Button>
            </div>

            <div className="mt-6 border-t border-ink/10 pt-5">
              <label
                htmlFor="follow-up"
                className="text-xs font-bold uppercase"
              >
                One follow-up question
              </label>
              <textarea
                id="follow-up"
                value={followUpValue}
                onChange={(event) => setFollowUp(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-ink/15 bg-white p-3 text-sm"
              />
              <Button
                className="mt-2 w-full"
                size="sm"
                variant="secondary"
                onClick={() =>
                  void act({
                    type: "request-follow-up",
                    question: followUpValue,
                  })
                }
                disabled={!followUpValue.trim() || busy}
              >
                Request follow-up
              </Button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void act({ type: "mark-ambiguous" })}
                disabled={busy}
              >
                Mark item ambiguous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void act({ type: "add-to-lesson-brief" })}
                disabled={busy || adjudication.addedToLessonBrief}
              >
                {adjudication.addedToLessonBrief
                  ? "Added to lesson brief"
                  : "Add to next lesson"}
              </Button>
            </div>

            <div className="mt-6 border-t border-ink/10 pt-5">
              <label htmlFor="feedback" className="text-xs font-bold uppercase">
                Concise student feedback
              </label>
              <textarea
                id="feedback"
                value={feedbackValue}
                onChange={(event) => setFeedback(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-ink/15 bg-white p-3 text-sm"
              />
              <Button
                className="mt-2 w-full"
                size="sm"
                onClick={() =>
                  void act({ type: "send-feedback", feedback: feedbackValue })
                }
                disabled={!feedbackValue.trim() || busy}
              >
                Send feedback
              </Button>
            </div>
          </Card>

          {item.studentQuestion ? (
            <Card tone="coral">
              <p className="text-xs font-bold text-coral-deep uppercase">
                Unresolved student question
              </p>
              <p className="mt-3 text-sm leading-6">{item.studentQuestion}</p>
            </Card>
          ) : null}

          <Card>
            <h2 className="font-editorial text-2xl font-bold">Audit trail</h2>
            <ol className="mt-4 space-y-3">
              {item.auditTrail.length ? (
                item.auditTrail
                  .slice()
                  .reverse()
                  .map((event) => (
                    <li
                      key={event.id}
                      className="border-l-2 border-violet/25 pl-3 text-sm leading-6"
                    >
                      <p className="font-bold">{event.summary}</p>
                      <p className="text-xs text-ink-muted">
                        {event.createdAt.slice(0, 16).replace("T", " ")}
                      </p>
                    </li>
                  ))
              ) : (
                <li className="text-sm text-ink-muted">
                  No tutor decision yet.
                </li>
              )}
            </ol>
          </Card>

          <Button
            href={`/tutor/students/${item.studentId}/lesson-brief` as Route}
            variant="ghost"
            className="w-full"
          >
            Open next lesson brief →
          </Button>
        </aside>
      </div>
    </div>
  );
}

"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  submitReadingEntryDiagnosticAction,
  type EntryDiagnosticActionState,
} from "@/app/actions/entry-diagnostic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AnswerConfidence } from "@/domain/study";
import type {
  EntryReadingDiagnosticItem,
  EntryReadingDiagnosticResponse,
} from "@/services/entry-reading-diagnostic";

const initialState: EntryDiagnosticActionState = {
  status: "idle",
  message: "",
};
const confidenceOptions: Array<{
  value: AnswerConfidence;
  label: string;
}> = [
  { value: "guessing", label: "Guessing" },
  { value: "think-so", label: "Think so" },
  { value: "certain", label: "Certain" },
];

export function EntryReadingDiagnostic({
  items,
  minimumTargetDate,
}: {
  items: EntryReadingDiagnosticItem[];
  minimumTargetDate: string;
}) {
  const [index, setIndex] = useState(0);
  const [targetTestDate, setTargetTestDate] = useState("");
  const [response, setResponse] = useState("");
  const [confidence, setConfidence] = useState<AnswerConfidence | null>(null);
  const [responses, setResponses] = useState<EntryReadingDiagnosticResponse[]>(
    [],
  );
  const [elapsed, setElapsed] = useState(0);
  const [state, action, pending] = useActionState(
    submitReadingEntryDiagnosticAction,
    initialState,
  );
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  const item = items[index];

  useEffect(() => {
    const timer = window.setInterval(
      () => setElapsed((value) => Math.min(900, value + 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [index]);

  function captureCurrent() {
    if (!response || !confidence) return responses;
    return [
      ...responses.filter((row) => row.itemId !== item.id),
      {
        itemId: item.id as EntryReadingDiagnosticResponse["itemId"],
        response,
        confidence,
        elapsedSeconds: elapsed,
      },
    ];
  }

  function continueNext() {
    const next = captureCurrent();
    if (next.length <= responses.length) return;
    setResponses(next);
    setIndex(index + 1);
    setResponse("");
    setConfidence(null);
    setElapsed(0);
  }

  const finalResponses = captureCurrent();
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-5 rounded-[1.5rem] border border-ink/10 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge tone="violet">Required Reading diagnostic</Badge>
            <p className="mt-2 text-xs font-bold text-ink-muted">
              Question {index + 1} of {items.length} · about 7 minutes total
            </p>
          </div>
          <p className="font-mono text-sm font-bold">
            {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
          </p>
        </div>
        <Progress
          value={Math.round((index / items.length) * 100)}
          label="Diagnostic progress"
        />
      </header>

      <Card className="p-0 sm:p-0">
        <div className="border-b border-ink/10 px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="violet">{item.taskType}</Badge>
            <Badge>{item.title}</Badge>
          </div>
        </div>
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          {index === 0 ? (
            <label
              className="mb-7 block text-sm font-bold"
              htmlFor="targetTestDate"
            >
              Target test date
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-base outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 sm:max-w-xs"
                id="targetTestDate"
                type="date"
                min={minimumTargetDate}
                value={targetTestDate}
                onChange={(event) => setTargetTestDate(event.target.value)}
                required
              />
            </label>
          ) : null}

          {item.kind === "complete-words" ? (
            <div>
              <p className="rounded-2xl bg-cream p-5 text-lg leading-8">
                {item.paragraphBefore}
                <strong>{item.wordPrefix}</strong>
                <span aria-label="missing word ending">___</span>
                {item.paragraphAfter}
              </p>
              <label
                className="mt-6 block text-sm font-bold"
                htmlFor={`response-${item.id}`}
              >
                Missing ending or complete word
              </label>
              <input
                className="mt-2 min-h-14 w-full rounded-2xl border-2 border-ink/15 bg-white px-4 text-lg font-bold outline-none focus:border-violet focus:ring-2 focus:ring-violet/20 sm:max-w-sm"
                id={`response-${item.id}`}
                value={response}
                onChange={(event) => setResponse(event.target.value)}
                autoComplete="off"
              />
            </div>
          ) : (
            <div>
              {item.stimulusTitle ? (
                <section
                  className="mb-7 rounded-3xl bg-cream p-5"
                  aria-label="Reading stimulus"
                >
                  <p className="text-xs font-bold tracking-[0.12em] text-violet uppercase">
                    {item.stimulusContext}
                  </p>
                  <h1 className="mt-2 font-editorial text-2xl">
                    {item.stimulusTitle}
                  </h1>
                  <div className="mt-4 space-y-3 text-sm leading-7">
                    {item.stimulusSegments?.map((segment) => (
                      <p key={segment.id}>{segment.text}</p>
                    ))}
                  </div>
                </section>
              ) : null}
              <h2 className="font-editorial text-2xl leading-snug sm:text-3xl">
                {item.prompt}
              </h2>
              <fieldset className="mt-6">
                <legend className="sr-only">Choose an answer</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {item.options.map((option) => (
                    <label
                      key={option.id}
                      className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 font-bold focus-within:outline-3 focus-within:outline-violet ${response === option.id ? "border-violet bg-violet-soft" : "border-ink/10 bg-white"}`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name={`response-${item.id}`}
                        checked={response === option.id}
                        onChange={() => setResponse(option.id)}
                      />
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink/20 uppercase">
                        {option.id}
                      </span>
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          <fieldset className="mt-8">
            <legend className="text-sm font-bold">How sure are you?</legend>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {confidenceOptions.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-2xl border p-3 text-center text-sm font-bold focus-within:outline-3 focus-within:outline-violet ${confidence === option.value ? "border-ink bg-ink text-white" : "border-ink/10"}`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name={`confidence-${item.id}`}
                    checked={confidence === option.value}
                    onChange={() => setConfidence(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="mt-7 text-xs leading-5 text-ink-muted">
            Answers stay hidden until the baseline is complete. The result
            selects a learning target; it is not an official TOEFL score.
          </p>
          {state.message ? (
            <p
              className="mt-4 rounded-2xl bg-coral-soft p-4 text-sm text-coral-deep"
              role="alert"
            >
              {state.message}
            </p>
          ) : null}
        </div>
        <footer className="flex justify-between gap-3 border-t border-ink/10 bg-cream px-5 py-5 sm:px-8">
          <Button
            variant="ghost"
            disabled={index === 0}
            onClick={() => {
              setIndex(index - 1);
              setResponse("");
              setConfidence(null);
              setElapsed(0);
            }}
          >
            Previous
          </Button>
          {index < items.length - 1 ? (
            <Button
              disabled={
                !response || !confidence || (index === 0 && !targetTestDate)
              }
              onClick={continueNext}
            >
              Save and continue
            </Button>
          ) : (
            <form action={action}>
              <input
                type="hidden"
                name="payload"
                value={JSON.stringify({
                  idempotencyKey,
                  targetTestDate,
                  responses: finalResponses,
                })}
              />
              <Button
                type="submit"
                disabled={
                  !response || !confidence || !targetTestDate || pending
                }
              >
                {pending ? "Building your plan…" : "Finish and build my plan"}
              </Button>
            </form>
          )}
        </footer>
      </Card>
      <p className="mt-5 text-center text-xs leading-5 text-ink-muted">
        Original practice content — not official ETS material.
      </p>
    </div>
  );
}

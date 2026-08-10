"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const TOUR_KEY = "tracetutor.demo.tour.v1";
export const TOUR_REPLAY_EVENT = "tracetutor:replay-tour";

const steps = [
  {
    kicker: "Today",
    title: "One correction target, not an endless set.",
    body: "Due D2 or D7 work comes before new practice. Every mission says what it is trying to interrupt.",
  },
  {
    kicker: "Trace",
    title: "Commit to confidence and evidence.",
    body: "For useful Reading diagnosis, choose an answer, state certainty, and select the sentence that supports it.",
  },
  {
    kicker: "Return",
    title: "Transfer and retention earn the streak.",
    body: "The Correction Streak records meaningful correction work. Browse the 14-day roadmap whenever you want the whole arc.",
  },
] as const;

export function ProductTour() {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    const revealTimer =
      window.localStorage.getItem(TOUR_KEY) !== "complete"
        ? window.setTimeout(() => setStep(0), 0)
        : null;
    const replay = () => setStep(0);
    window.addEventListener(TOUR_REPLAY_EVENT, replay);
    return () => {
      if (revealTimer !== null) window.clearTimeout(revealTimer);
      window.removeEventListener(TOUR_REPLAY_EVENT, replay);
    };
  }, []);

  function close() {
    window.localStorage.setItem(TOUR_KEY, "complete");
    setStep(null);
  }

  if (step === null) return null;
  const current = steps[step];
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-ink/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-body"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-[2rem] bg-paper shadow-2xl">
        <div
          className="relative h-28 overflow-hidden bg-violet-soft"
          aria-hidden="true"
        >
          <span className="absolute top-7 left-10 h-3 w-3 rounded-full bg-coral" />
          <span className="absolute top-12 left-13 h-1 w-56 rotate-[-8deg] bg-ink/25" />
          <span className="absolute top-7 right-24 size-16 rotate-12 rounded-2xl border-[12px] border-violet/25" />
          <span className="absolute right-10 bottom-5 size-7 rounded-full bg-mint-deep" />
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-bold tracking-[0.16em] text-violet uppercase">
              {current.kicker}
            </p>
            <p className="text-xs font-bold text-ink-muted">
              {step + 1} / {steps.length}
            </p>
          </div>
          <h2
            id="tour-title"
            className="mt-4 font-editorial text-4xl tracking-tight"
          >
            {current.title}
          </h2>
          <p id="tour-body" className="mt-4 text-sm leading-7 text-ink-muted">
            {current.body}
          </p>
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={close}>
              Skip tour
            </Button>
            <Button
              onClick={() =>
                step === steps.length - 1 ? close() : setStep(step + 1)
              }
            >
              {step === steps.length - 1 ? "Open Today" : "Next"}
              <span aria-hidden="true">→</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function replayProductTour() {
  window.dispatchEvent(new Event(TOUR_REPLAY_EVENT));
}

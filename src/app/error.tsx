"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-4 py-12">
      <div className="max-w-xl text-center">
        <div
          className="mx-auto grid size-16 place-items-center rounded-2xl bg-coral-soft font-editorial text-3xl text-coral-deep"
          aria-hidden="true"
        >
          !
        </div>
        <p className="mt-6 text-xs font-bold tracking-[0.16em] text-violet uppercase">
          The trace broke
        </p>
        <h1 className="mt-3 font-editorial text-5xl tracking-tight">
          Let’s pick it up again.
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          TraceTutor could not load this view. Your demo data has not been
          changed.
        </p>
        <Button className="mt-7" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}

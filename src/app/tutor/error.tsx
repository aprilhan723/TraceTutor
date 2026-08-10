"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TutorError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="mx-auto max-w-xl text-center sm:p-10">
      <p className="text-xs font-bold tracking-[0.14em] text-coral-deep uppercase">
        Tutor workspace error
      </p>
      <h1 className="mt-4 font-editorial text-4xl">
        The review queue could not be opened.
      </h1>
      <p className="mt-4 text-sm leading-6 text-ink-muted">
        Your local adjudications remain stored on this device. Try loading this
        view again.
      </p>
      <Button className="mt-7" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}

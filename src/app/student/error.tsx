"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function StudentError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="mx-auto max-w-xl text-center sm:p-10">
      <p className="text-xs font-bold tracking-[0.14em] text-coral-deep uppercase">
        Student workspace error
      </p>
      <h1 className="mt-4 font-editorial text-4xl">
        Your saved local trace has not been discarded.
      </h1>
      <p className="mt-4 text-sm leading-6 text-ink-muted">
        Try loading this view again. If the issue remains, Reset demo data is
        available from the demo menu.
      </p>
      <Button className="mt-7" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}

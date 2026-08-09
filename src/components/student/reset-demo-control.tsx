"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStudentDemo } from "@/components/student/student-demo-provider";
import { cn } from "@/lib/cn";

export function ResetDemoControl({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { resetDemo } = useStudentDemo();
  const router = useRouter();

  async function handleReset() {
    setResetting(true);
    await resetDemo();
    setResetting(false);
    setOpen(false);
    router.push("/student/today");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "rounded-xl border border-ink/10 bg-white font-semibold text-ink-muted transition hover:bg-coral-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral",
          compact
            ? "grid size-9 place-items-center text-base"
            : "min-h-10 w-full px-3 text-xs",
        )}
        aria-label={compact ? "Open demo data settings" : undefined}
      >
        {compact ? "⚙" : "Reset demo data"}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="reset-demo-title"
          aria-describedby="reset-demo-description"
        >
          <div className="w-full max-w-md rounded-[1.75rem] bg-paper p-6 shadow-2xl sm:p-8">
            <p className="text-xs font-bold tracking-[0.14em] text-coral-deep uppercase">
              Demo settings
            </p>
            <h2 id="reset-demo-title" className="mt-3 font-editorial text-3xl">
              Reset Jamie’s local sprint?
            </h2>
            <p
              id="reset-demo-description"
              className="mt-3 text-sm leading-6 text-ink-muted"
            >
              This removes onboarding choices and all work completed on this
              device, then restores the original tutor-verified baseline.
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={resetting}
              >
                Keep my progress
              </Button>
              <Button onClick={handleReset} disabled={resetting}>
                {resetting ? "Resetting…" : "Reset demo"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

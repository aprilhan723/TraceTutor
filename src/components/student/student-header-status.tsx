"use client";

import Link from "next/link";
import { ProofSprout } from "@/components/student/proof-sprout";
import { useStudentDemo } from "@/components/student/student-demo-provider";

export function StudentHeaderStatus() {
  const { state, recoveryPass } = useStudentDemo();
  const streak = state?.streakStats.current ?? 0;
  const d2Passed =
    state?.retentionSchedules.some(
      (schedule) => schedule.cadence === "D2" && schedule.outcome === "secure",
    ) ?? false;
  const d7Passed =
    state?.retentionSchedules.some(
      (schedule) => schedule.cadence === "D7" && schedule.outcome === "secure",
    ) ?? false;
  const resolvedPatternCount =
    state?.patterns.filter((pattern) => pattern.status === "resolved").length ??
    0;
  return (
    <Link
      href="/student/progress"
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-coral/25 bg-coral-soft px-3 text-xs font-bold text-coral-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
      aria-label={`Proof Sprout, ${streak}-day Correction Streak. Open progress.`}
    >
      <ProofSprout
        streak={streak}
        d2Passed={d2Passed}
        d7Passed={d7Passed}
        resolvedPatternCount={resolvedPatternCount}
        recoveryPassAvailable={recoveryPass?.available ?? false}
        size="compact"
        decorative
      />
      <span>{streak}</span>
      <span className="hidden sm:inline">day Correction Streak</span>
    </Link>
  );
}

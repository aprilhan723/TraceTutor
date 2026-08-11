"use client";

import Link from "next/link";
import { useStudentDemo } from "@/components/student/student-demo-provider";

export function StudentHeaderStatus() {
  const { state } = useStudentDemo();
  const streak = state?.streakStats.current ?? 0;
  return (
    <Link
      href="/student/progress"
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-coral/25 bg-coral-soft px-3 text-xs font-bold text-coral-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
      aria-label={`${streak}-day Correction Streak. Open progress.`}
    >
      <span aria-hidden="true">◆</span>
      <span>{streak}</span>
      <span className="hidden sm:inline">day Correction Streak</span>
    </Link>
  );
}

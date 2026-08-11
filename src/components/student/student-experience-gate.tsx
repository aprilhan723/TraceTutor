"use client";

import type { ReactNode } from "react";
import { OnboardingFlow } from "@/components/student/onboarding-flow";
import { ProductTour } from "@/components/student/product-tour";
import { useStudentDemo } from "@/components/student/student-demo-provider";

export function StudentExperienceGate({ children }: { children: ReactNode }) {
  const { hydrated, state } = useStudentDemo();

  if (!hydrated) {
    return (
      <div
        className="animate-pulse motion-reduce:animate-none"
        aria-label="Loading saved demo"
      >
        <div className="h-4 w-36 rounded-full bg-violet/15" />
        <div className="mt-5 h-14 max-w-xl rounded-2xl bg-ink/8" />
        <div className="mt-10 h-96 rounded-[2rem] bg-white" />
      </div>
    );
  }

  return (
    <>
      {children}
      {!state?.studyPlan?.onboardingCompletedAt ? <OnboardingFlow /> : null}
      {state?.studyPlan?.onboardingCompletedAt ? <ProductTour /> : null}
    </>
  );
}

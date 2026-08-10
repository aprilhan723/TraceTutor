import type { Metadata } from "next";
import { DiagnosisReview } from "@/components/tutor/diagnosis-review";
import { TutorProductionDashboard } from "@/components/production/tutor-workspace";
import { isSupabaseRuntime } from "@/lib/runtime-mode";

export const metadata: Metadata = { title: "Diagnosis Review" };

export default async function DiagnosisReviewPage({
  params,
}: {
  params: Promise<{ diagnosisId: string }>;
}) {
  const { diagnosisId } = await params;
  return (await isSupabaseRuntime()) ? (
    <TutorProductionDashboard />
  ) : (
    <DiagnosisReview caseId={diagnosisId} />
  );
}

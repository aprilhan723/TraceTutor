import type { Metadata } from "next";
import { DiagnosisReview } from "@/components/tutor/diagnosis-review";

export const metadata: Metadata = { title: "Diagnosis Review" };

export default async function DiagnosisReviewPage({
  params,
}: {
  params: Promise<{ diagnosisId: string }>;
}) {
  const { diagnosisId } = await params;
  return <DiagnosisReview caseId={diagnosisId} />;
}

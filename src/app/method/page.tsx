import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public-info-page";

export const metadata: Metadata = {
  title: "Method",
  description:
    "The transparent Answer, Evidence, Diagnose, Transfer, Retain correction method.",
};

export default function MethodPage() {
  return (
    <PublicInfoPage
      eyebrow="Learning method"
      title="Answer. Evidence. Diagnose. Transfer. Retain."
      summary="TraceTutor limits new volume so a learner can make one repeated Reading error observable, correct it on a distinct surface, and return after time."
      sections={[
        {
          title: "Correction before collection",
          body: "A daily mission surfaces reviews due 2 and 7 days after a correction before new practice, then chooses a small target rather than an endless set.",
        },
        {
          title: "Confidence with evidence",
          body: "For diagnostic reading items, learners commit to an answer, confidence, and a specific text segment. Correct-but-unsupported work remains Unstable.",
        },
        {
          title: "Human adjudication",
          body: "A short rule-based probe can suggest a cause. The tutor reviews the original suggestion, evidence trace, recurrence, and history before approving or changing it.",
        },
        {
          title: "Resolution has a high bar",
          body: "A pattern improves through distinct transfer and spaced retention. Weekly Boss completion alone never resolves a pattern.",
        },
      ]}
    />
  );
}

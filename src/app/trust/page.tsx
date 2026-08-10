import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public-info-page";

export const metadata: Metadata = {
  title: "Trust",
  description:
    "How TraceTutor separates software suggestions, tutor verification, and official testing.",
};

export default function TrustPage() {
  return (
    <PublicInfoPage
      eyebrow="Trust center"
      title="Useful signals, honestly labeled."
      summary="TraceTutor makes the difference between a rule-based suggestion, a tutor decision, and official test information visible."
      sections={[
        {
          title: "Tutor verification",
          body: "The local demo stores the original rule suggestion separately from the tutor’s adjudication. A verified correction means a tutor reviewed that learning trace—not that ETS verified it.",
        },
        {
          title: "No psychological claims",
          body: "Priority scores explain observable reasons such as a high-confidence wrong answer or a failed review. They are workflow aids, not claims about a learner’s character or mind.",
        },
        {
          title: "No score theater",
          body: "Progress shows mission completion, evidence accuracy, confidence calibration, transfer, and retention. It does not convert practice into a fake TOEFL score.",
        },
        {
          title: "Local release boundary",
          body: "This release uses browser storage only. It has no account system, remote synchronization, payment, advertising, tracking SDK, or external AI.",
        },
      ]}
    />
  );
}

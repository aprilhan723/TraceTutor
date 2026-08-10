import type { Metadata } from "next";
import { PublicInfoPage } from "@/components/public-info-page";

export const metadata: Metadata = {
  title: "Content Standards",
  description:
    "Originality, review, evidence, and versioning standards for TraceTutor practice content.",
};

export default function ContentStandardsPage() {
  return (
    <PublicInfoPage
      eyebrow="Content standards"
      title="Original practice with a visible evidence contract."
      summary="Every included stimulus and item is original, independently produced practice inspired by task formats—not copied official material."
      sections={[
        {
          title: "Original by design",
          body: "Demo passages, notices, options, word-completion paragraphs, probes, and transfer prompts are written for TraceTutor. Company mascots and official question text are not used.",
        },
        {
          title: "Review requirements",
          body: "Publishable items require exactly one correct answer, complete options, designated evidence, and distractor tags where relevant.",
        },
        {
          title: "Version integrity",
          body: "Published content creates a new version when edited so past attempts remain attached to the content the learner actually saw.",
        },
        {
          title: "Ambiguity is allowed",
          body: "Tutors can mark an item ambiguous. The product should preserve that adjudication instead of forcing certainty into the learning record.",
        },
      ]}
    />
  );
}

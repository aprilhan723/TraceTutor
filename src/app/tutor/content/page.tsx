import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Content" };

export default function TutorContentPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Correction library"
        title="Content"
        description="Tutor-verified practice organized by task family, mistake pattern, and transfer goal."
      />
      <div className="mt-8">
        <EmptyState
          eyebrow="Library shell"
          title="Original correction content comes next"
          description="Phase 2 can add original items for Complete the Words, Read in Daily Life, and Read an Academic Passage. No copyrighted test content is included in this demo."
        />
      </div>
    </div>
  );
}

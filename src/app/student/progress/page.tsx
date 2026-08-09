import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Progress" };

export default function StudentProgressPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Retention over volume"
        title="Progress"
        description="Track which corrections hold when the same reasoning challenge returns."
      />
      <div className="mt-8">
        <EmptyState
          eyebrow="Progress starts after a sprint"
          title="No retention signal yet"
          description="Complete correction and transfer checks will populate this view in Phase 2. Practice feedback here will remain a learning signal, not an official TOEFL score."
        />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { demoIds, demoLearningService } from "@/services/learning-service";

export const metadata: Metadata = { title: "Students" };

export default async function TutorStudentsPage() {
  const dashboard = await demoLearningService.getTutorDashboard(demoIds.tutor);

  if (!dashboard) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Student roster"
        title="Students"
        description="A compact view of current correction focus and the signal worth bringing into the next lesson."
        action={
          <Badge tone="violet">{dashboard.students.length} demo student</Badge>
        }
      />
      <div className="mt-8">
        {dashboard.students.map((student) => (
          <Card
            key={student.id}
            className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-full bg-mint font-bold text-mint-deep">
                {student.initials}
              </span>
              <div>
                <h2 className="font-editorial text-2xl font-bold">
                  {student.name}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Reading goal {student.targetScore} ·{" "}
                  {student.currentStreakDays}-day trace streak
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="coral">Evidence drift</Badge>
              <Badge tone="neutral">Profile view planned</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

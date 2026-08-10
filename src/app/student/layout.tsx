import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ResetDemoControl } from "@/components/student/reset-demo-control";
import { StudentDemoProvider } from "@/components/student/student-demo-provider";
import { StudentExperienceGate } from "@/components/student/student-experience-gate";
import { TutorDemoProvider } from "@/components/tutor/tutor-demo-provider";
import { demoIds, demoLearningService } from "@/services/learning-service";

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const home = await demoLearningService.getStudentHome(demoIds.student);

  if (!home) {
    notFound();
  }

  return (
    <TutorDemoProvider>
      <StudentDemoProvider student={home.student}>
        <AppShell
          role="student"
          userName={home.student.name}
          userInitials={home.student.initials}
          demoDesktopControl={<ResetDemoControl />}
          demoMobileControl={<ResetDemoControl compact />}
        >
          <StudentExperienceGate>{children}</StudentExperienceGate>
        </AppShell>
      </StudentDemoProvider>
    </TutorDemoProvider>
  );
}

import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TutorDemoProvider } from "@/components/tutor/tutor-demo-provider";
import { demoIds, demoLearningService } from "@/services/learning-service";

export default async function TutorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const dashboard = await demoLearningService.getTutorDashboard(demoIds.tutor);

  if (!dashboard) {
    notFound();
  }

  return (
    <TutorDemoProvider>
      <AppShell
        role="tutor"
        userName={dashboard.tutor.name}
        userInitials={dashboard.tutor.initials}
      >
        {children}
      </AppShell>
    </TutorDemoProvider>
  );
}

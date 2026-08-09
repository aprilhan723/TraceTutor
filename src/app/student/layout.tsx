import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
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
    <AppShell
      role="student"
      userName={home.student.name}
      userInitials={home.student.initials}
    >
      {children}
    </AppShell>
  );
}

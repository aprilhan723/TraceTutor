import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TutorDemoProvider } from "@/components/tutor/tutor-demo-provider";
import { demoIds, demoLearningService } from "@/services/learning-service";
import { isSupabaseRuntime } from "@/lib/runtime-mode";
import { requireAccountRole } from "@/auth/access";
import { SignOutForm } from "@/components/auth/sign-out-form";

export default async function TutorLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (await isSupabaseRuntime()) {
    const account = await requireAccountRole("tutor");
    if (!account) notFound();
    const initials = account.displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
    return (
      <AppShell
        role="tutor"
        userName={account.displayName}
        userInitials={initials || "T"}
        demoMode={false}
        demoDesktopControl={<SignOutForm />}
        demoMobileControl={<SignOutForm compact />}
      >
        {children}
      </AppShell>
    );
  }
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

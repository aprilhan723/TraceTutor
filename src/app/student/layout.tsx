import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ResetDemoControl } from "@/components/student/reset-demo-control";
import { StudentDemoProvider } from "@/components/student/student-demo-provider";
import { ConnectivityNotice } from "@/components/student/connectivity-notice";
import { StudentExperienceGate } from "@/components/student/student-experience-gate";
import { TutorDemoProvider } from "@/components/tutor/tutor-demo-provider";
import { demoIds, demoLearningService } from "@/services/learning-service";
import { isSupabaseRuntime } from "@/lib/runtime-mode";
import { requireAccountRole } from "@/auth/access";
import { SignOutForm } from "@/components/auth/sign-out-form";
import { StudentHeaderStatus } from "@/components/student/student-header-status";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (await isSupabaseRuntime()) {
    const account = await requireAccountRole("student");
    if (!account) notFound();
    const initials = account.displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
    const supabase = await createSupabaseServerClient();
    const { data: streak } = await supabase
      .from("learner_streak_stats")
      .select("current_streak")
      .eq("learner_id", account.userId)
      .maybeSingle();
    return (
      <AppShell
        role="student"
        userName={account.displayName}
        userInitials={initials || "S"}
        demoMode={false}
        headerStatus={
          <Badge tone="coral">
            Correction Streak · {streak?.current_streak ?? 0}
          </Badge>
        }
        demoDesktopControl={<SignOutForm />}
        demoMobileControl={<SignOutForm compact />}
      >
        {children}
      </AppShell>
    );
  }
  const home = await demoLearningService.getStudentHome(demoIds.student);

  if (!home) {
    notFound();
  }

  return (
    <TutorDemoProvider>
      <StudentDemoProvider student={home.student}>
        <ConnectivityNotice />
        <AppShell
          role="student"
          userName={home.student.name}
          userInitials={home.student.initials}
          demoDesktopControl={<ResetDemoControl />}
          demoMobileControl={<ResetDemoControl compact />}
          headerStatus={<StudentHeaderStatus />}
        >
          <StudentExperienceGate>{children}</StudentExperienceGate>
        </AppShell>
      </StudentDemoProvider>
    </TutorDemoProvider>
  );
}

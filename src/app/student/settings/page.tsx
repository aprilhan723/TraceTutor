import type { Metadata } from "next";
import { StudyPlanSettings } from "@/components/student/study-plan-settings";
import { StudentProductionStudyPlan } from "@/components/production/student-workspace";
import { isSupabaseRuntime } from "@/lib/runtime-mode";

export const metadata: Metadata = { title: "Study Plan Settings" };
export default async function SettingsPage() {
  return (await isSupabaseRuntime()) ? (
    <StudentProductionStudyPlan />
  ) : (
    <StudyPlanSettings />
  );
}

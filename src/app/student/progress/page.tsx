import type { Metadata } from "next";
import { ProgressDashboard } from "@/components/student/progress-dashboard";
import { StudentProductionProgress } from "@/components/production/student-workspace";
import { isSupabaseRuntime } from "@/lib/runtime-mode";

export const metadata: Metadata = { title: "Progress" };

export default async function StudentProgressPage() {
  return (await isSupabaseRuntime()) ? (
    <StudentProductionProgress surface="progress" />
  ) : (
    <ProgressDashboard />
  );
}

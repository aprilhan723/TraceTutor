import type { Metadata } from "next";
import { WeeklyReportView } from "@/components/student/weekly-report";
import { StudentProductionProgress } from "@/components/production/student-workspace";
import { isSupabaseRuntime } from "@/lib/runtime-mode";

export const metadata: Metadata = { title: "Weekly Report" };

export default async function StudentWeeklyReportPage() {
  return (await isSupabaseRuntime()) ? (
    <StudentProductionProgress surface="progress" />
  ) : (
    <WeeklyReportView />
  );
}

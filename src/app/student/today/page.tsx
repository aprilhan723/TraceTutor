import type { Metadata } from "next";
import { TodayDashboard } from "@/components/student/today-dashboard";
import { StudentProductionToday } from "@/components/production/student-workspace";
import { isSupabaseRuntime } from "@/lib/runtime-mode";

export const metadata: Metadata = { title: "Today" };

export default async function StudentTodayPage() {
  return (await isSupabaseRuntime()) ? (
    <StudentProductionToday />
  ) : (
    <TodayDashboard />
  );
}

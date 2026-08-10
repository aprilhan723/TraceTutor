import type { Metadata } from "next";
import { WeeklyBoss } from "@/components/student/weekly-boss";
import { StudentProductionProgress } from "@/components/production/student-workspace";
import { isSupabaseRuntime } from "@/lib/runtime-mode";

export const metadata: Metadata = { title: "The Half-Truth Hydra" };
export default async function WeeklyBossPage() {
  return (await isSupabaseRuntime()) ? (
    <StudentProductionProgress surface="progress" />
  ) : (
    <WeeklyBoss />
  );
}

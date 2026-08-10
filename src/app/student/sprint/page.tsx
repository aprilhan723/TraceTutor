import type { Metadata } from "next";
import { SprintRoadmap } from "@/components/student/sprint-roadmap";
import { StudentProductionProgress } from "@/components/production/student-workspace";
import { isSupabaseRuntime } from "@/lib/runtime-mode";

export const metadata: Metadata = { title: "14-Day Sprint" };
export default async function StudentSprintPage() {
  return (await isSupabaseRuntime()) ? (
    <StudentProductionProgress surface="progress" />
  ) : (
    <SprintRoadmap />
  );
}

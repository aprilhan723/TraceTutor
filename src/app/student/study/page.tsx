import type { Metadata } from "next";
import { StudyHub } from "@/components/student/study-hub";
import { StudentProductionProgress } from "@/components/production/student-workspace";
import { isSupabaseRuntime } from "@/lib/runtime-mode";

export const metadata: Metadata = { title: "Study" };

export default async function StudentStudyPage() {
  return (await isSupabaseRuntime()) ? (
    <StudentProductionProgress surface="progress" />
  ) : (
    <StudyHub />
  );
}

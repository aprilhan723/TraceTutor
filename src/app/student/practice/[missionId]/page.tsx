import type { Metadata } from "next";
import { PracticeExperience } from "@/components/student/practice-experience";
import { StudentProductionPractice } from "@/components/production/student-workspace";
import { isSupabaseRuntime } from "@/lib/runtime-mode";

export const metadata: Metadata = { title: "Correction Sprint" };

export default async function PracticePage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  return (await isSupabaseRuntime()) ? (
    <StudentProductionPractice assignmentItemId={missionId} />
  ) : (
    <PracticeExperience missionId={missionId} />
  );
}

import type { Metadata } from "next";
import { StudentDetail } from "@/components/tutor/student-detail";
import { TutorProductionStudentDetail } from "@/components/production/tutor-workspace";
import { isSupabaseRuntime } from "@/lib/runtime-mode";

export const metadata: Metadata = { title: "Student Detail" };

export default async function TutorStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return (await isSupabaseRuntime()) ? (
    <TutorProductionStudentDetail studentId={studentId} />
  ) : (
    <StudentDetail studentId={studentId} />
  );
}

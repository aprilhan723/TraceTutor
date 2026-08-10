import type { Metadata } from "next";
import { StudentDetail } from "@/components/tutor/student-detail";

export const metadata: Metadata = { title: "Student Detail" };

export default async function TutorStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <StudentDetail studentId={studentId} />;
}

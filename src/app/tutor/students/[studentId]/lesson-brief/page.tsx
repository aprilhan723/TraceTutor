import type { Metadata } from "next";
import { LessonBrief } from "@/components/tutor/lesson-brief";

export const metadata: Metadata = { title: "Next Lesson Brief" };

export default async function LessonBriefPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <LessonBrief studentId={studentId} />;
}

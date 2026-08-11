import type { Metadata } from "next";
import { StudySessionView } from "@/components/student/study-session-view";

export const metadata: Metadata = { title: "Study session" };

export default async function StudySessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <StudySessionView sessionId={sessionId} />;
}

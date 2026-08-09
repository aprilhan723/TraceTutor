import type { Metadata } from "next";
import { PracticeExperience } from "@/components/student/practice-experience";

export const metadata: Metadata = { title: "Correction Sprint" };

export default async function PracticePage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  return <PracticeExperience missionId={missionId} />;
}

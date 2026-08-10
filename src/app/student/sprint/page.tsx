import type { Metadata } from "next";
import { SprintRoadmap } from "@/components/student/sprint-roadmap";

export const metadata: Metadata = { title: "14-Day Sprint" };
export default function StudentSprintPage() {
  return <SprintRoadmap />;
}

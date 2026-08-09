import type { Metadata } from "next";
import { ProgressDashboard } from "@/components/student/progress-dashboard";

export const metadata: Metadata = { title: "Progress" };

export default function StudentProgressPage() {
  return <ProgressDashboard />;
}

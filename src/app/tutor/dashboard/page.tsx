import type { Metadata } from "next";
import { TutorDashboard } from "@/components/tutor/tutor-dashboard";

export const metadata: Metadata = { title: "Tutor Dashboard" };

export default function TutorDashboardPage() {
  return <TutorDashboard />;
}

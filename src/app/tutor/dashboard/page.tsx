import type { Metadata } from "next";
import { TutorDashboard } from "@/components/tutor/tutor-dashboard";
import { TutorProductionDashboard } from "@/components/production/tutor-workspace";
import { isSupabaseRuntime } from "@/lib/runtime-mode";

export const metadata: Metadata = { title: "Tutor Dashboard" };

export default async function TutorDashboardPage() {
  return (await isSupabaseRuntime()) ? (
    <TutorProductionDashboard />
  ) : (
    <TutorDashboard />
  );
}

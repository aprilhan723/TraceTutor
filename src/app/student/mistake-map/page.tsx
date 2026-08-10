import type { Metadata } from "next";
import { MistakeMapDashboard } from "@/components/student/mistake-map-dashboard";
import { StudentProductionProgress } from "@/components/production/student-workspace";
import { isSupabaseRuntime } from "@/lib/runtime-mode";

export const metadata: Metadata = { title: "Mistake Map" };

export default async function MistakeMapPage() {
  return (await isSupabaseRuntime()) ? (
    <StudentProductionProgress surface="map" />
  ) : (
    <MistakeMapDashboard />
  );
}

import type { Metadata } from "next";
import { MistakeMapDashboard } from "@/components/student/mistake-map-dashboard";

export const metadata: Metadata = { title: "Mistake Map" };

export default function MistakeMapPage() {
  return <MistakeMapDashboard />;
}

import type { Metadata } from "next";
import { TodayDashboard } from "@/components/student/today-dashboard";

export const metadata: Metadata = { title: "Today" };

export default function StudentTodayPage() {
  return <TodayDashboard />;
}

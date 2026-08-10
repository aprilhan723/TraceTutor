import type { Metadata } from "next";
import { WeeklyReportView } from "@/components/student/weekly-report";

export const metadata: Metadata = { title: "Weekly Report" };

export default function StudentWeeklyReportPage() {
  return <WeeklyReportView />;
}

import type { Metadata } from "next";
import { WeeklyBoss } from "@/components/student/weekly-boss";

export const metadata: Metadata = { title: "The Half-Truth Hydra" };
export default function WeeklyBossPage() {
  return <WeeklyBoss />;
}

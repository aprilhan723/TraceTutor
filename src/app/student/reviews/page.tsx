import type { Metadata } from "next";
import { ReviewsDashboard } from "@/components/student/reviews-dashboard";
import { StudentProductionProgress } from "@/components/production/student-workspace";
import { isSupabaseRuntime } from "@/lib/runtime-mode";

export const metadata: Metadata = { title: "Reviews" };
export default async function ReviewsPage() {
  return (await isSupabaseRuntime()) ? (
    <StudentProductionProgress surface="progress" />
  ) : (
    <ReviewsDashboard />
  );
}

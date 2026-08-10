import type { Metadata } from "next";
import { StudentsRoster } from "@/components/tutor/students-roster";
import { TutorProductionStudents } from "@/components/production/tutor-workspace";
import { isSupabaseRuntime } from "@/lib/runtime-mode";

export const metadata: Metadata = { title: "Students" };

export default async function TutorStudentsPage() {
  return (await isSupabaseRuntime()) ? (
    <TutorProductionStudents />
  ) : (
    <StudentsRoster />
  );
}

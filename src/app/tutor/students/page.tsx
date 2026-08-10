import type { Metadata } from "next";
import { StudentsRoster } from "@/components/tutor/students-roster";

export const metadata: Metadata = { title: "Students" };

export default function TutorStudentsPage() {
  return <StudentsRoster />;
}

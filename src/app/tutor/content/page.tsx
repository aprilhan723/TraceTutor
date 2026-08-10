import type { Metadata } from "next";
import { ContentLibrary } from "@/components/tutor/content-library";

export const metadata: Metadata = { title: "Content" };

export default function TutorContentPage() {
  return <ContentLibrary />;
}

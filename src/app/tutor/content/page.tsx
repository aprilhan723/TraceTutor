import type { Metadata } from "next";
import { ContentLibrary } from "@/components/tutor/content-library";
import { TutorProductionContent } from "@/components/production/tutor-workspace";
import { isSupabaseRuntime } from "@/lib/runtime-mode";

export const metadata: Metadata = { title: "Content" };

export default async function TutorContentPage() {
  return (await isSupabaseRuntime()) ? (
    <TutorProductionContent />
  ) : (
    <ContentLibrary />
  );
}

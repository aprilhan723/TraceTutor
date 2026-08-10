import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAccountRole } from "@/auth/access";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { TutorWorkspaceForm } from "@/components/auth/profile-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Create tutor workspace" };

export default async function TutorSetupPage() {
  if (!isSupabaseConfigured()) redirect("/demo");
  await requireAccountRole("tutor");
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("memberships")
    .select("id")
    .eq("role", "tutor")
    .is("retired_at", null)
    .limit(1);
  if (existing?.length) redirect("/tutor/dashboard");
  return (
    <AuthPageShell
      eyebrow="Tutor onboarding"
      title="Open one focused workspace."
      description="Start with one organization and class. The schema supports more students and classes without changing the student ownership boundary."
    >
      <TutorWorkspaceForm />
    </AuthPageShell>
  );
}

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOptionalAccount } from "@/auth/access";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { CompleteProfileForm } from "@/components/auth/profile-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Complete account" };

export default async function CompleteProfilePage() {
  if (!isSupabaseConfigured()) redirect("/demo");
  const account = await getOptionalAccount();
  if (account) {
    redirect(account.role === "tutor" ? "/tutor/dashboard" : "/student/today");
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) redirect("/auth/sign-in");
  const cookieStore = await cookies();
  return (
    <AuthPageShell
      eyebrow="One-time role setup"
      title="Choose the account boundary."
      description="Tutor roles can create a workspace. Student roles require a valid one-time invitation, and the role cannot later be self-escalated."
    >
      <CompleteProfileForm
        suggestedName={cookieStore.get("tt_display_name")?.value ?? ""}
        inviteToken={cookieStore.get("tt_invite")?.value ?? ""}
      />
    </AuthPageShell>
  );
}

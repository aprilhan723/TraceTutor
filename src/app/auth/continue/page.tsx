import { redirect } from "next/navigation";
import { getOptionalAccount } from "@/auth/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AuthContinuePage() {
  if (!isSupabaseConfigured()) redirect("/demo");
  const account = await getOptionalAccount();
  if (account) {
    redirect(account.role === "tutor" ? "/tutor/dashboard" : "/student/today");
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) redirect("/auth/sign-in");
  redirect("/auth/complete-profile");
}

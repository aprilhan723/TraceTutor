import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Student invitation" };

export default async function StudentInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/demo");
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(token)) redirect("/auth/expired");
  redirect(`/auth/sign-up?invite=${encodeURIComponent(token)}`);
}

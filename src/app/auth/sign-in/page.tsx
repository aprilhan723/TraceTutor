import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalAccount } from "@/auth/access";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { SignInForm } from "@/components/auth/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  if (!isSupabaseConfigured()) redirect("/demo");
  const account = await getOptionalAccount();
  if (account) {
    redirect(account.role === "tutor" ? "/tutor/dashboard" : "/student/today");
  }
  return (
    <AuthPageShell
      eyebrow="Secure account"
      title="Continue your correction trace."
      description="Cookie-based server authentication keeps the account boundary separate from the preserved local demo."
    >
      <SignInForm />
      <p className="mt-6 text-center text-sm text-ink-muted">
        New to TraceTutor?{" "}
        <Link href="/auth/sign-up" className="font-bold text-violet underline">
          Create an account
        </Link>
      </p>
    </AuthPageShell>
  );
}

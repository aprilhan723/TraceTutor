import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { SignUpForm } from "@/components/auth/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/demo");
  const { invite } = await searchParams;
  return (
    <AuthPageShell
      eyebrow={invite ? "Student invitation" : "TraceTutor account"}
      title={
        invite
          ? "Join your tutor’s correction class."
          : "Create a secure workspace."
      }
      description={
        invite
          ? "The invitation is checked once after email confirmation. It cannot be used to join another tutor or class."
          : "Create an account first. Your permanent tutor or student role is set only during the verified onboarding step."
      }
    >
      <SignUpForm invite={invite} />
      {process.env.TRACETUTOR_EMAIL_CONFIRMATION_REQUIRED !== "true" ? (
        <p className="mt-5 rounded-2xl bg-violet-soft px-4 py-3 text-xs leading-5 text-ink-muted">
          Public beta accounts use a password and, for students, a one-time
          tutor invitation. Email verification and password reset remain
          unavailable until dedicated transactional email is connected.
        </p>
      ) : null}
      <p className="mt-6 text-center text-sm text-ink-muted">
        Already registered?{" "}
        <Link href="/auth/sign-in" className="font-bold text-violet underline">
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}

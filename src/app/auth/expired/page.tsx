import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Link expired" };

export default function ExpiredAuthLinkPage() {
  return (
    <AuthPageShell
      eyebrow="Link unavailable"
      title="That secure link has expired."
      description="Email sign-in and confirmation links are intentionally short-lived and single-use. Request another without changing your existing role or class link."
    >
      <Button href="/auth/sign-in" className="w-full">
        Return to sign in
      </Button>
    </AuthPageShell>
  );
}

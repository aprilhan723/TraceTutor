import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Choose a demo",
  description: "Explore TraceTutor as a student or tutor.",
};

const roles = [
  {
    label: "Student",
    eyebrow: "Ten-minute correction sprint",
    description:
      "Set a personal pace, complete an evidence-first Today Mission, and trace real local progress built around retention—not volume.",
    href: "/demo/student" as const,
    action: "Enter as Student",
    tone: "coral",
    symbol: "01",
  },
  {
    label: "Tutor",
    eyebrow: "Pre-lesson diagnostic view",
    description:
      "See the intervention queue, demo student list, and content shell that make repeated reasoning patterns visible.",
    href: "/demo/tutor" as const,
    action: "Enter as Tutor",
    tone: "violet",
    symbol: "02",
  },
] as const;

export default function DemoPage() {
  const accountsAvailable = isSupabaseConfigured();

  return (
    <main className="relative min-h-dvh overflow-hidden bg-cream px-4 py-6 sm:px-6 sm:py-10">
      <div
        className="marketing-grid absolute inset-0 opacity-70"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-3">
          <BrandMark />
          <div className="flex items-center gap-2">
            {accountsAvailable ? (
              <Button
                href="/account"
                nativeNavigation
                variant="secondary"
                size="sm"
              >
                Open my account
              </Button>
            ) : null}
            <Button href="/" variant="ghost" size="sm">
              Back home
            </Button>
          </div>
        </div>

        <header className="mx-auto max-w-3xl pt-18 text-center sm:pt-24">
          <p className="text-xs font-bold tracking-[0.18em] text-violet uppercase">
            TraceTutor demo
          </p>
          <h1 className="mt-4 font-editorial text-5xl leading-[0.98] tracking-[-0.045em] text-balance sm:text-7xl">
            Follow the mistake from either side.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
            Choose a role to explore the local product demo. You can switch
            roles at any time while Demo Mode is active.
          </p>
        </header>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 pb-16 sm:mt-16 md:grid-cols-2">
          {roles.map((role) => (
            <section
              key={role.label}
              className={`group relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_18px_60px_rgba(36,31,28,0.08)] transition-transform duration-300 hover:-translate-y-1 sm:p-9 ${role.tone === "coral" ? "border-coral/25 bg-coral-soft" : "border-violet/20 bg-violet-soft"}`}
            >
              <span
                className={`absolute -top-10 -right-6 font-editorial text-[9rem] leading-none ${role.tone === "coral" ? "text-coral/20" : "text-violet/15"}`}
                aria-hidden="true"
              >
                {role.symbol}
              </span>
              <div className="relative">
                <p
                  className={`text-xs font-bold tracking-[0.14em] uppercase ${role.tone === "coral" ? "text-coral-deep" : "text-violet"}`}
                >
                  {role.eyebrow}
                </p>
                <h2 className="mt-12 font-editorial text-4xl tracking-tight sm:text-5xl">
                  {role.label}
                </h2>
                <p className="mt-4 min-h-24 text-sm leading-6 text-ink-muted sm:text-base sm:leading-7">
                  {role.description}
                </p>
                <Button
                  href={role.href}
                  nativeNavigation
                  variant={role.tone === "coral" ? "primary" : "violet"}
                  className="mt-8 w-full"
                  size="lg"
                >
                  {role.action} <span aria-hidden="true">→</span>
                </Button>
              </div>
            </section>
          ))}
        </div>

        <p className="mx-auto max-w-3xl pb-8 text-center text-xs leading-5 text-ink-muted">
          Demo data is fictional. TraceTutor is independent practice software,
          not endorsed by ETS, and practice feedback is not an official TOEFL
          score.
        </p>
      </div>
    </main>
  );
}

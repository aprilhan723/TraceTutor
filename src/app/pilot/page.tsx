import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Founding Tutor Pilot",
  description:
    "Try TraceTutor with your TOEFL Reading students during the public beta and help shape the founding tutor plan.",
  alternates: {
    canonical: "/pilot",
  },
};

const pilotIncludes = [
  "One tutor workspace with a transparent intervention queue",
  "Invite-only student accounts and browser-local sales demo",
  "2026 Reading correction across three task families",
  "Mistake patterns, 2-day/7-day retention, lesson briefs, and weekly reports",
  "Tutor adjudication kept separate from machine suggestions",
] as const;

const fitSignals = [
  [
    "Good fit",
    "You teach 3–12 TOEFL Reading students and review mistakes between lessons.",
  ],
  [
    "Best use",
    "You already have original or properly licensed materials and need a correction workflow.",
  ],
  [
    "Not a fit",
    "You want a large official question bank, automatic scores, or hands-off AI teaching.",
  ],
] as const;

export default function PilotPage() {
  const accountMode = isSupabaseConfigured();
  const primaryHref = accountMode ? "/auth/sign-up" : "/demo";

  return (
    <div className="min-h-dvh bg-cream text-ink">
      <header className="border-b border-ink/10 bg-paper/90 backdrop-blur-xl">
        <nav
          className="mx-auto flex min-h-18 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"
          aria-label="Pilot navigation"
        >
          <BrandMark />
          <div className="flex items-center gap-3">
            <Link
              className="hidden text-sm font-semibold text-ink-muted hover:text-ink sm:inline"
              href="/"
            >
              Back to overview
            </Link>
            <Button href="/demo" variant="secondary" size="sm">
              Open demo
            </Button>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div
            className="marketing-grid absolute inset-0 -z-20"
            aria-hidden="true"
          />
          <div
            className="absolute top-16 -right-24 -z-10 size-80 rounded-full bg-coral/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
            <div>
              <p className="inline-flex rounded-full border border-violet/15 bg-violet-soft px-3 py-2 text-xs font-bold tracking-[0.14em] text-violet uppercase">
                Founding Tutor Pilot · Public beta
              </p>
              <h1 className="mt-7 max-w-3xl font-editorial text-[clamp(3.4rem,8vw,6.5rem)] leading-[0.88] tracking-[-0.055em] text-balance">
                Spend the lesson on the{" "}
                <span className="text-coral-deep italic">right mistake.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-ink-muted">
                TraceTutor turns student evidence traces into a short,
                tutor-reviewable intervention queue. The founding pilot is for
                independent tutors who want to test that workflow with real
                students before billing opens.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button href={primaryHref} size="lg">
                  {accountMode
                    ? "Create a tutor workspace"
                    : "Explore the pilot demo"}{" "}
                  <span aria-hidden="true">→</span>
                </Button>
                <Button href="/demo" variant="secondary" size="lg">
                  Inspect both roles
                </Button>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-6 text-ink-muted">
                No card is collected during the public beta. Account recovery
                email is not yet available, so do not use a password you cannot
                safely retain.
              </p>
            </div>

            <Card tone="violet" className="relative overflow-hidden p-7 sm:p-9">
              <div
                className="absolute -top-14 -right-14 size-44 rounded-full border-[28px] border-violet/10"
                aria-hidden="true"
              />
              <p className="text-xs font-bold tracking-[0.16em] text-violet uppercase">
                Founding price hypothesis
              </p>
              <div className="mt-4 flex items-end gap-2">
                <span className="font-editorial text-6xl font-bold tracking-tight">
                  $49
                </span>
                <span className="pb-2 text-sm font-semibold text-ink-muted">
                  / tutor / month
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-ink-muted">
                Planned for up to 12 active students after the beta. This is a
                transparent pricing hypothesis, not a charge or checkout offer.
                Early usage will decide whether the plan, limit, and price are
                worth keeping.
              </p>
              <ul className="mt-7 space-y-4 border-t border-violet/15 pt-6 text-sm leading-6">
                {pilotIncludes.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span
                      className="font-bold text-mint-deep"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        <section className="border-y border-ink/10 bg-paper">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
            <SectionHeading
              eyebrow="Fit before features"
              title="Built for a narrow teaching workflow."
              description="The pilot is intentionally specific so a small tutor practice can tell quickly whether it saves preparation time or improves the next lesson."
            />
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {fitSignals.map(([label, description], index) => (
                <Card key={label} tone={index === 2 ? "coral" : "paper"}>
                  <p className="text-xs font-bold tracking-[0.15em] text-violet uppercase">
                    {label}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-ink-muted">
                    {description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <SectionHeading
              eyebrow="A useful first session"
              title="Test the workflow in under thirty minutes."
              description="Start with fictional data, then decide whether one learner and one recurring Reading pattern are worth moving into the account beta."
            />
            <ol className="space-y-4">
              {[
                [
                  "01",
                  "Open the tutor demo",
                  "Inspect the intervention queue and one full diagnosis trace.",
                ],
                [
                  "02",
                  "Switch to the student",
                  "Complete one correction and see how evidence becomes tutor-visible context.",
                ],
                [
                  "03",
                  "Create a workspace",
                  "If the workflow fits, register as a tutor and invite one learner.",
                ],
              ].map(([number, title, detail]) => (
                <li key={number}>
                  <Card className="flex gap-5 p-6">
                    <span className="font-editorial text-3xl font-bold text-violet">
                      {number}
                    </span>
                    <div>
                      <h2 className="font-editorial text-2xl font-bold">
                        {title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-ink-muted">
                        {detail}
                      </p>
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-4 pb-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl rounded-[2.5rem] bg-violet px-6 py-16 text-center text-white sm:px-12 sm:py-20">
            <p className="text-xs font-bold tracking-[0.18em] text-coral-soft uppercase">
              One learner. One repeating pattern.
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl font-editorial text-4xl tracking-tight text-balance sm:text-5xl">
              See whether TraceTutor changes your next lesson.
            </h2>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href={primaryHref} size="lg">
                {accountMode ? "Start the public beta" : "Open the demo"}
              </Button>
              <Button href="/method" variant="secondary" size="lg">
                Review the method
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-ink/10 bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-xs leading-5 text-ink-muted sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <p className="max-w-2xl">
            TraceTutor is independent practice software, not endorsed by or
            affiliated with ETS. TOEFL is a registered trademark of ETS.
            Practice feedback is not an official TOEFL score or prediction.
          </p>
          <div className="flex gap-5 font-semibold">
            <Link href="/privacy">Privacy</Link>
            <Link href="/trust">Trust</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

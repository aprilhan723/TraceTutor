import type { Route } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export interface PublicInfoSection {
  title: string;
  body: string;
  points?: readonly string[];
}

export function PublicInfoPage({
  eyebrow,
  title,
  summary,
  sections,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  sections: readonly PublicInfoSection[];
}) {
  return (
    <div className="min-h-dvh bg-cream text-ink">
      <header className="border-b border-ink/10 bg-paper">
        <nav
          className="mx-auto flex min-h-18 max-w-5xl items-center justify-between px-4 sm:px-6"
          aria-label="Policy navigation"
        >
          <BrandMark />
          <Button href="/demo" variant="secondary" size="sm">
            Explore demo
          </Button>
        </nav>
      </header>
      <main
        id="main-content"
        className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20"
      >
        <p className="text-xs font-bold tracking-[0.16em] text-violet uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-5 max-w-4xl font-editorial text-5xl leading-[0.98] tracking-[-0.04em] sm:text-7xl">
          {title}
        </h1>
        <p className="mt-7 max-w-3xl text-lg leading-8 text-ink-muted">
          {summary}
        </p>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[1.75rem] border border-ink/10 bg-paper p-6 shadow-sm sm:p-8"
            >
              <h2 className="font-editorial text-3xl">{section.title}</h2>
              <p className="mt-4 text-sm leading-7 text-ink-muted">
                {section.body}
              </p>
              {section.points ? (
                <ul className="mt-5 space-y-3 text-sm leading-6 text-ink-muted">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="text-mint-deep" aria-hidden="true">
                        ✓
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
        <div className="mt-12 rounded-[1.75rem] bg-violet-soft p-6 sm:p-8">
          <p className="font-bold text-violet-deep">
            Independent-product boundary
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
            TraceTutor is independent practice software, not endorsed by or
            affiliated with ETS. TOEFL is a registered trademark of ETS.
            Practice feedback is not an official TOEFL score or score
            prediction.
          </p>
        </div>
      </main>
      <footer className="border-t border-ink/10 bg-paper">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-x-5 gap-y-3 px-4 py-8 text-xs font-semibold text-ink-muted sm:px-6">
          {(["trust", "privacy", "content-standards", "method"] as const).map(
            (path) => (
              <Link
                key={path}
                href={`/${path}` as Route}
                className="capitalize hover:text-ink"
              >
                {path.replace("-", " ")}
              </Link>
            ),
          )}
        </div>
      </footer>
    </div>
  );
}

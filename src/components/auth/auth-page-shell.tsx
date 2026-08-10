import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Card } from "@/components/ui/card";

export function AuthPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-cream px-4 py-6 sm:px-6 sm:py-10">
      <div className="marketing-grid absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl">
        <BrandMark />
        <div className="mx-auto mt-14 grid max-w-4xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <header className="pt-4">
            <p className="text-xs font-bold tracking-[0.16em] text-violet uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-3 font-editorial text-5xl leading-[0.98] tracking-[-0.04em] sm:text-6xl">
              {title}
            </h1>
            <p className="mt-5 text-base leading-7 text-ink-muted">
              {description}
            </p>
          </header>
          <Card className="p-6 sm:p-8">{children}</Card>
        </div>
        <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-5 text-ink-muted">
          TraceTutor is independent practice software, not endorsed by ETS.
          Practice feedback is not an official TOEFL score.
        </p>
      </div>
    </main>
  );
}

import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface BrandMarkProps {
  compact?: boolean;
  href?: Route;
  invert?: boolean;
}

export function BrandMark({
  compact = false,
  href = "/",
  invert = false,
}: BrandMarkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral",
        invert ? "text-white" : "text-ink",
      )}
      aria-label="TraceTutor home"
    >
      <span
        className="relative grid size-9 place-items-center rounded-xl bg-coral text-sm font-black text-ink shadow-[3px_3px_0_var(--color-violet)]"
        aria-hidden="true"
      >
        T
        <span className="absolute -right-1 -bottom-1 size-2.5 rounded-full border-2 border-current bg-mint" />
      </span>
      {!compact ? (
        <span className="font-editorial text-xl font-bold tracking-[-0.03em]">
          TraceTutor
        </span>
      ) : null}
    </Link>
  );
}

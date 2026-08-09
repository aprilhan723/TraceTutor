import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "coral" | "violet" | "mint";
}

const toneStyles = {
  neutral: "bg-ink/6 text-ink-muted",
  coral: "bg-coral-soft text-coral-deep",
  violet: "bg-violet-soft text-violet-deep",
  mint: "bg-mint text-mint-deep",
} as const;

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-bold tracking-[0.05em] uppercase",
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}

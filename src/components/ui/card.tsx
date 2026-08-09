import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "paper" | "violet" | "mint" | "coral";
}

const toneStyles = {
  paper: "border-ink/10 bg-white",
  violet: "border-violet/15 bg-violet-soft",
  mint: "border-mint-deep/15 bg-mint",
  coral: "border-coral/20 bg-coral-soft",
} as const;

export function Card({ className, tone = "paper", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border p-5 shadow-[0_12px_40px_rgba(36,31,28,0.055)] sm:p-6",
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}

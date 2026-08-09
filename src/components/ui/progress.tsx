import { cn } from "@/lib/cn";

interface ProgressProps {
  value: number;
  label: string;
  className?: string;
  tone?: "coral" | "violet" | "mint";
}

const tones = {
  coral: "bg-coral",
  violet: "bg-violet",
  mint: "bg-mint-deep",
} as const;

export function Progress({
  value,
  label,
  className,
  tone = "coral",
}: ProgressProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn("h-2.5 overflow-hidden rounded-full bg-ink/8", className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalizedValue}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none",
          tones[tone],
        )}
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
}

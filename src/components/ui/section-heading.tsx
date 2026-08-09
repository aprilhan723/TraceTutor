import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  invert?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  invert = false,
}: SectionHeadingProps) {
  return (
    <div
      className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}
    >
      <p
        className={cn(
          "text-xs font-bold tracking-[0.18em] uppercase",
          invert ? "text-coral-soft" : "text-violet",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-3 font-editorial text-4xl leading-[1.02] tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl",
          invert ? "text-white" : "text-ink",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-5 max-w-2xl text-base leading-7 sm:text-lg",
            align === "center" && "mx-auto",
            invert ? "text-white/70" : "text-ink-muted",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

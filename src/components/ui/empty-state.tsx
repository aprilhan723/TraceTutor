import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  eyebrow = "Nothing here yet",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card className="flex min-h-72 flex-col items-center justify-center border-dashed text-center">
      <div
        className="mb-5 grid size-14 place-items-center rounded-2xl bg-violet-soft text-2xl text-violet"
        aria-hidden="true"
      >
        ◇
      </div>
      <p className="text-xs font-bold tracking-[0.16em] text-violet uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-editorial text-3xl tracking-tight text-ink">
        {title}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-ink-muted">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  );
}

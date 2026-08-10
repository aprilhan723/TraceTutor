import { signOutAction } from "@/auth/actions";

export function SignOutForm({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className={
          compact
            ? "grid size-9 place-items-center rounded-full border border-ink/10 bg-white text-sm font-bold focus-visible:outline-2 focus-visible:outline-violet"
            : "min-h-11 w-full rounded-2xl border border-ink/15 bg-white px-4 text-sm font-semibold transition hover:border-coral focus-visible:outline-2 focus-visible:outline-coral"
        }
        aria-label={compact ? "Sign out" : undefined}
      >
        {compact ? "↪" : "Sign out"}
      </button>
    </form>
  );
}

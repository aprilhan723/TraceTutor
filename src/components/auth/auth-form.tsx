"use client";

import { useActionState } from "react";
import { magicLinkAction, signInAction, signUpAction } from "@/auth/actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "mt-2 min-h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-base outline-none transition focus:border-violet focus:ring-2 focus:ring-violet/20";
const initialAuthActionState = { status: "idle" as const, message: "" };

function Feedback({ message, success }: { message: string; success: boolean }) {
  if (!message) return null;
  return (
    <p
      className={`mt-4 rounded-2xl px-4 py-3 text-sm leading-6 ${success ? "bg-mint text-mint-deep" : "bg-coral-soft text-coral-deep"}`}
      role={success ? "status" : "alert"}
    >
      {message}
    </p>
  );
}

export function SignInForm({
  emailLinkEnabled = false,
}: {
  emailLinkEnabled?: boolean;
}) {
  const [state, action, pending] = useActionState(
    signInAction,
    initialAuthActionState,
  );
  const [magicState, magicAction, magicPending] = useActionState(
    magicLinkAction,
    initialAuthActionState,
  );
  return (
    <div className="space-y-8">
      <form action={action}>
        <label className="block text-sm font-bold" htmlFor="email">
          Email
        </label>
        <input
          className={inputClass}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <label className="mt-5 block text-sm font-bold" htmlFor="password">
          Password
        </label>
        <input
          className={inputClass}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <Feedback
          message={state.message}
          success={state.status === "success"}
        />
        <Button className="mt-6 w-full" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {emailLinkEnabled ? (
        <div className="border-t border-ink/10 pt-7">
          <p className="text-sm font-bold">Prefer a one-time link?</p>
          <form
            action={magicAction}
            className="mt-3 flex flex-col gap-3 sm:flex-row"
          >
            <label className="sr-only" htmlFor="magicEmail">
              Email for magic link
            </label>
            <input
              className={`${inputClass} mt-0 flex-1`}
              id="magicEmail"
              name="magicEmail"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
            <Button type="submit" variant="secondary" disabled={magicPending}>
              Email link
            </Button>
          </form>
          <Feedback
            message={magicState.message}
            success={magicState.status === "success"}
          />
        </div>
      ) : null}
    </div>
  );
}

export function SignUpForm({ invite }: { invite?: string }) {
  const [state, action, pending] = useActionState(
    signUpAction,
    initialAuthActionState,
  );
  return (
    <form action={action}>
      {invite ? <input type="hidden" name="invite" value={invite} /> : null}
      <label className="block text-sm font-bold" htmlFor="displayName">
        Name
      </label>
      <input
        className={inputClass}
        id="displayName"
        name="displayName"
        autoComplete="name"
        required
      />
      <label className="mt-5 block text-sm font-bold" htmlFor="email">
        Email
      </label>
      <input
        className={inputClass}
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <label className="mt-5 block text-sm font-bold" htmlFor="password">
        Password
      </label>
      <input
        className={inputClass}
        id="password"
        name="password"
        type="password"
        minLength={10}
        autoComplete="new-password"
        aria-describedby="password-help"
        required
      />
      <p id="password-help" className="mt-2 text-xs leading-5 text-ink-muted">
        At least 10 characters with a letter and a number. A password manager is
        recommended.
      </p>
      <Feedback message={state.message} success={state.status === "success"} />
      <Button className="mt-6 w-full" type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create secure account"}
      </Button>
    </form>
  );
}

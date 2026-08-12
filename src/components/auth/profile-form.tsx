"use client";

import { useActionState } from "react";
import {
  completeProfileAction,
  createTutorWorkspaceAction,
} from "@/auth/actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "mt-2 min-h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-base outline-none focus:border-violet focus:ring-2 focus:ring-violet/20";
const initialAuthActionState = { status: "idle" as const, message: "" };

export function CompleteProfileForm({
  suggestedName,
  inviteToken,
}: {
  suggestedName: string;
  inviteToken: string;
}) {
  const [state, action, pending] = useActionState(
    completeProfileAction,
    initialAuthActionState,
  );
  return (
    <form action={action}>
      <label className="block text-sm font-bold" htmlFor="displayName">
        Name
      </label>
      <input
        className={inputClass}
        id="displayName"
        name="displayName"
        defaultValue={suggestedName}
        autoComplete="name"
        required
      />
      <div className="mt-6 rounded-2xl bg-violet-soft px-4 py-4">
        <p className="text-xs font-bold tracking-[0.12em] text-violet uppercase">
          Fixed account role
        </p>
        <p className="mt-1 font-bold">
          {inviteToken
            ? "Student · tutor invitation verified next"
            : "Tutor · workspace owner"}
        </p>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          Students can join only through a one-time tutor code. Account roles
          cannot be self-promoted later.
        </p>
      </div>
      {inviteToken ? (
        <input type="hidden" name="inviteToken" value={inviteToken} />
      ) : null}
      {state.message ? (
        <p
          className="mt-4 rounded-2xl bg-coral-soft px-4 py-3 text-sm text-coral-deep"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
      <Button className="mt-6 w-full" type="submit" disabled={pending}>
        {pending
          ? "Securing role…"
          : inviteToken
            ? "Join class and start diagnostic"
            : "Continue to workspace setup"}
      </Button>
    </form>
  );
}

export function TutorWorkspaceForm() {
  const [state, action, pending] = useActionState(
    createTutorWorkspaceAction,
    initialAuthActionState,
  );
  return (
    <form action={action}>
      <label className="block text-sm font-bold" htmlFor="organizationName">
        Tutor workspace
      </label>
      <input
        className={inputClass}
        id="organizationName"
        name="organizationName"
        placeholder="Maya Chen Reading Studio"
        required
      />
      <label className="mt-5 block text-sm font-bold" htmlFor="className">
        First class
      </label>
      <input
        className={inputClass}
        id="className"
        name="className"
        placeholder="August Reading Sprint"
        required
      />
      {state.message ? (
        <p
          className="mt-4 rounded-2xl bg-coral-soft px-4 py-3 text-sm text-coral-deep"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
      <Button className="mt-6 w-full" type="submit" disabled={pending}>
        {pending ? "Creating workspace…" : "Create workspace and class"}
      </Button>
    </form>
  );
}

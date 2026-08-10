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
      <fieldset className="mt-6">
        <legend className="text-sm font-bold">I am joining as</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(["tutor", "student"] as const).map((role) => (
            <label
              key={role}
              className="flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border border-ink/15 bg-white px-4 font-semibold capitalize has-checked:border-violet has-checked:bg-violet-soft"
            >
              <input
                type="radio"
                name="role"
                value={role}
                defaultChecked={role === (inviteToken ? "student" : "tutor")}
              />
              {role}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-6 block text-sm font-bold" htmlFor="inviteToken">
        Student invite code <span className="font-normal">(students only)</span>
      </label>
      <input
        className={inputClass}
        id="inviteToken"
        name="inviteToken"
        defaultValue={inviteToken}
        autoComplete="off"
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
        {pending ? "Securing role…" : "Continue"}
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

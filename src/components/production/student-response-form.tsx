"use client";

import { useActionState, useEffect, useState } from "react";
import { submitProductionResponseAction } from "@/app/actions/workspace";
import type { loadProductionPracticeItem } from "@/data/supabase-workspace";
import { Button } from "@/components/ui/button";

type Practice = NonNullable<
  Awaited<ReturnType<typeof loadProductionPracticeItem>>
>;
const initialState = { status: "idle" as const, message: "" };

export function ProductionResponseForm({
  practice,
  clientSubmissionId,
}: {
  practice: Practice;
  clientSubmissionId: string;
}) {
  const [state, action, pending] = useActionState(
    submitProductionResponseAction,
    initialState,
  );
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [startedAt]);
  return (
    <form action={action} className="mt-7">
      <input
        type="hidden"
        name="assignmentItemId"
        value={practice.assignmentItem.id}
      />
      <input
        type="hidden"
        name="clientSubmissionId"
        value={clientSubmissionId}
      />
      <input type="hidden" name="elapsedSeconds" value={elapsed} />
      <input type="hidden" name="answerChanges" value="0" />
      {practice.version.response_kind === "choice" ? (
        <>
          <fieldset>
            <legend className="font-bold">1. Choose an answer</legend>
            <div className="mt-3 space-y-3">
              {practice.options.map((option) => (
                <label
                  key={option.id}
                  className="flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border border-ink/15 p-4 has-checked:border-violet has-checked:bg-violet-soft"
                >
                  <input
                    type="radio"
                    name="selectedOptionId"
                    value={option.id}
                    required
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-7">
            <legend className="font-bold">2. Mark confidence</legend>
            <div className="mt-3 flex flex-wrap gap-3">
              {[
                ["guessing", "Guessing"],
                ["think-so", "Think so"],
                ["certain", "Certain"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-ink/15 bg-white px-4 has-checked:border-violet has-checked:bg-violet-soft"
                >
                  <input
                    type="radio"
                    name="confidence"
                    value={value}
                    required
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      ) : (
        <div>
          <label className="font-bold" htmlFor="typedResponse">
            Type the missing ending or word
          </label>
          <input
            id="typedResponse"
            name="typedResponse"
            className="mt-3 min-h-12 w-full rounded-2xl border border-ink/15 px-4 text-lg outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
            autoComplete="off"
            required
          />
        </div>
      )}
      <fieldset className="mt-7">
        <legend className="font-bold">
          {practice.version.response_kind === "choice"
            ? "3. Select the evidence you used"
            : "Source context"}
        </legend>
        <div className="mt-3 space-y-3">
          {practice.evidence.map((span) => (
            <label
              key={span.id}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 bg-cream p-4"
            >
              <input type="checkbox" name="evidenceSpanIds" value={span.id} />
              <span className="text-sm leading-6">{span.excerpt}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {state.message ? (
        <p
          className={`mt-5 rounded-2xl p-4 text-sm ${state.status === "error" ? "bg-coral-soft text-coral-deep" : "bg-mint text-mint-deep"}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
      <Button
        className="mt-6 w-full"
        type="submit"
        disabled={pending || state.status === "success"}
      >
        {pending
          ? "Saving securely…"
          : state.status === "success"
            ? "Response saved"
            : "Submit correction trace"}
      </Button>
    </form>
  );
}

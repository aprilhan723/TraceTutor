"use client";

import { useActionState, useState } from "react";
import {
  copyDemoContentAction,
  createAssignmentAction,
  generateStudentInviteAction,
} from "@/app/actions/workspace";
import type { WorkspaceActionState } from "@/app/actions/workspace";
import type {
  ProductionClass,
  ProductionContentItem,
  ProductionStudent,
} from "@/data/supabase-workspace";
import { Button } from "@/components/ui/button";

const initialState = { status: "idle" as const, message: "" };
const fieldClass =
  "mt-2 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20";

function Status({ state }: { state: WorkspaceActionState }) {
  if (!state.message) return null;
  return (
    <div
      className={`mt-4 rounded-2xl p-4 text-sm leading-6 ${state.status === "error" ? "bg-coral-soft text-coral-deep" : "bg-mint text-mint-deep"}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      <p>{state.message}</p>
      {state.inviteUrl ? (
        <p className="mt-2 font-semibold break-all select-all">
          {state.inviteUrl}
        </p>
      ) : null}
      {state.inviteCode ? (
        <details className="mt-2">
          <summary className="cursor-pointer font-semibold">
            Show invite code
          </summary>
          <code className="mt-2 block rounded-xl bg-white/70 p-2 text-xs break-all select-all">
            {state.inviteCode}
          </code>
        </details>
      ) : null}
    </div>
  );
}

export function TutorInviteControl({
  classes,
}: {
  classes: ProductionClass[];
}) {
  const [state, action, pending] = useActionState(
    generateStudentInviteAction,
    initialState,
  );
  return (
    <form action={action}>
      <label className="text-sm font-bold" htmlFor="invite-class">
        Class
      </label>
      <select className={fieldClass} id="invite-class" name="classId" required>
        {classes.map((classroom) => (
          <option key={classroom.id} value={classroom.id}>
            {classroom.name}
          </option>
        ))}
      </select>
      <Button
        className="mt-4 w-full"
        type="submit"
        variant="violet"
        disabled={pending || !classes.length}
      >
        {pending ? "Creating invitation…" : "Generate one-time student invite"}
      </Button>
      <Status state={state} />
    </form>
  );
}

export function CopyDemoContentControl() {
  const [state, action, pending] = useActionState(
    copyDemoContentAction,
    initialState,
  );
  return (
    <form action={action}>
      <p className="text-sm leading-6 text-ink-muted">
        Copies only TraceTutor’s original stimuli, options, evidence, and
        reviewed metadata. Fictional students and attempts are excluded.
      </p>
      <Button
        className="mt-4 w-full"
        type="submit"
        variant="secondary"
        disabled={pending}
      >
        {pending
          ? "Copying original content…"
          : "Copy demo content into my workspace"}
      </Button>
      <Status state={state} />
    </form>
  );
}

export function AssignmentControl({
  classes,
  students,
  content,
}: {
  classes: ProductionClass[];
  students: ProductionStudent[];
  content: ProductionContentItem[];
}) {
  const [state, action, pending] = useActionState(
    createAssignmentAction,
    initialState,
  );
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [idempotencyKey] = useState(() => globalThis.crypto.randomUUID());
  const student = students.find((candidate) => candidate.id === studentId);
  return (
    <form action={action}>
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <label className="text-sm font-bold" htmlFor="assignment-student">
        Student
      </label>
      <select
        className={fieldClass}
        id="assignment-student"
        name="studentId"
        value={studentId}
        onChange={(event) => setStudentId(event.target.value)}
        required
      >
        {students.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {candidate.displayName}
          </option>
        ))}
      </select>
      <input
        type="hidden"
        name="classId"
        value={student?.classId ?? classes[0]?.id ?? ""}
      />
      <label className="mt-4 block text-sm font-bold" htmlFor="assignment-item">
        Published item
      </label>
      <select
        className={fieldClass}
        id="assignment-item"
        name="itemVersionId"
        required
      >
        {content.map((item) => (
          <option key={item.itemVersionId} value={item.itemVersionId}>
            {item.taskType} · {item.title}
          </option>
        ))}
      </select>
      <label
        className="mt-4 block text-sm font-bold"
        htmlFor="assignment-title"
      >
        Mission label
      </label>
      <input
        className={fieldClass}
        id="assignment-title"
        name="title"
        defaultValue="Tutor-assigned correction"
        required
      />
      <label className="mt-4 block text-sm font-bold" htmlFor="assignment-due">
        Due time <span className="font-normal">(optional)</span>
      </label>
      <input
        className={fieldClass}
        id="assignment-due"
        name="dueAt"
        type="datetime-local"
      />
      <Button
        className="mt-5 w-full"
        type="submit"
        disabled={pending || !students.length || !content.length}
      >
        {pending ? "Assigning…" : "Assign correction item"}
      </Button>
      <Status state={state} />
    </form>
  );
}

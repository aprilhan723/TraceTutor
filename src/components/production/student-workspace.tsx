import { randomUUID } from "node:crypto";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { requireAccountRole } from "@/auth/access";
import { saveStudentOnboardingAction } from "@/app/actions/workspace";
import { ProductionResponseForm } from "@/components/production/student-response-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerNow } from "@/lib/server-time";
import {
  loadProductionPracticeItem,
  loadStudentAssignments,
} from "@/data/supabase-workspace";

const fieldClass =
  "mt-2 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20";

export async function StudentProductionToday() {
  const account = await requireAccountRole("student");
  if (!account) return null;
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, target_test_date, onboarding_completed_at")
    .eq("id", account.userId)
    .single();
  if (!profile?.onboarding_completed_at) {
    const tomorrow = new Date(
      getServerNow().getTime() + 30 * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 10);
    return (
      <div>
        <PageHeader
          eyebrow="Student onboarding"
          title="Personalize the first real mission."
          description="These settings belong to your authenticated profile and shape the correction schedule."
        />
        <Card className="mt-7 max-w-2xl">
          <form action={saveStudentOnboardingAction}>
            <label className="text-sm font-bold" htmlFor="targetTestDate">
              Target test date
            </label>
            <input
              className={fieldClass}
              id="targetTestDate"
              name="targetTestDate"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              defaultValue={tomorrow}
              required
            />
            <label
              className="mt-4 block text-sm font-bold"
              htmlFor="readingConfidence"
            >
              Reading confidence
            </label>
            <select
              className={fieldClass}
              id="readingConfidence"
              name="readingConfidence"
              defaultValue="developing"
            >
              <option value="beginner">Beginner</option>
              <option value="developing">Developing</option>
              <option value="strong">Strong</option>
            </select>
            <label
              className="mt-4 block text-sm font-bold"
              htmlFor="dailyStudyMinutes"
            >
              Daily time
            </label>
            <select
              className={fieldClass}
              id="dailyStudyMinutes"
              name="dailyStudyMinutes"
              defaultValue="10"
            >
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
            </select>
            <label
              className="mt-4 block text-sm font-bold"
              htmlFor="reminderTime"
            >
              Preferred reminder time
            </label>
            <input
              className={fieldClass}
              id="reminderTime"
              name="reminderTime"
              type="time"
              defaultValue="19:00"
              required
            />
            <label
              className="mt-4 block text-sm font-bold"
              htmlFor="mainStruggle"
            >
              Main struggle
            </label>
            <select
              className={fieldClass}
              id="mainStruggle"
              name="mainStruggle"
              defaultValue="finding-evidence"
            >
              <option value="vocabulary">Vocabulary</option>
              <option value="finding-evidence">Finding evidence</option>
              <option value="inference">Inference</option>
              <option value="time-pressure">Time pressure</option>
              <option value="not-sure">Not sure</option>
            </select>
            <Button className="mt-6" type="submit">
              Save and see Today
            </Button>
          </form>
        </Card>
      </div>
    );
  }
  const assignments = await loadStudentAssignments(account.userId);
  const pending = assignments.filter((item) => !item.completed);
  const daysUntil = profile.target_test_date
    ? Math.max(
        0,
        Math.ceil(
          (new Date(`${profile.target_test_date}T00:00:00Z`).getTime() -
            getServerNow().getTime()) /
            86_400_000,
        ),
      )
    : null;
  return (
    <div>
      <PageHeader
        eyebrow="Authenticated Today"
        title={`Hello, ${profile.display_name}.`}
        description={
          daysUntil === null
            ? "Your tutor-linked mission queue is ready."
            : `${daysUntil} days until your target test date. Complete due tutor work before new practice.`
        }
      />
      <div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card tone={pending.length ? "coral" : "mint"}>
          <p className="text-xs font-bold tracking-[0.14em] text-coral-deep uppercase">
            Tutor-assigned corrections
          </p>
          <h2 className="mt-2 font-editorial text-3xl">
            {pending.length
              ? `${pending.length} mission item${pending.length === 1 ? "" : "s"} ready`
              : "All assigned work is secure"}
          </h2>
          {pending.length ? (
            <ul className="mt-5 space-y-3">
              {pending.map((item) => (
                <li key={item.id} className="rounded-2xl bg-white/80 p-4">
                  <p className="font-bold">{item.assignmentTitle}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {item.taskType} · Original independent practice
                  </p>
                  <Button
                    href={`/student/practice/${item.id}` as Route}
                    className="mt-4"
                    size="sm"
                  >
                    Start correction
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-mint-deep">
              Completed responses remain visible to your linked tutor. No
              official score is calculated.
            </p>
          )}
        </Card>
        <Card>
          <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
            Correction Streak
          </p>
          <p className="mt-2 font-editorial text-4xl">Verified work only</p>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            Authenticated streak credit is derived from qualifying review,
            correction, transfer, or tutor-assigned completion—not login
            activity.
          </p>
        </Card>
      </div>
    </div>
  );
}

export async function StudentProductionPractice({
  assignmentItemId,
}: {
  assignmentItemId: string;
}) {
  const account = await requireAccountRole("student");
  if (!account) return null;
  if (!/^[0-9a-f-]{36}$/i.test(assignmentItemId)) notFound();
  const practice = await loadProductionPracticeItem(
    account.userId,
    assignmentItemId,
  );
  if (!practice) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge tone="violet">Tutor assigned</Badge>
        <p className="text-xs font-bold text-ink-muted">
          Original practice content — not official ETS material
        </p>
      </div>
      <Card className="mt-5">
        <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
          {practice.assignmentItem.taskType}
        </p>
        <h1 className="mt-3 font-editorial text-4xl leading-tight">
          {practice.version.prompt}
        </h1>
        <ProductionResponseForm
          practice={practice}
          clientSubmissionId={randomUUID()}
        />
      </Card>
    </div>
  );
}

export async function StudentProductionProgress({
  surface,
}: {
  surface: "map" | "progress";
}) {
  const account = await requireAccountRole("student");
  if (!account) return null;
  const supabase = await createSupabaseServerClient();
  const { data: states } = await supabase
    .from("learner_error_states")
    .select(
      "id, error_cause_code, status, recurrence_count, secure_transfer_count",
    )
    .eq("student_id", account.userId);
  return (
    <div>
      <PageHeader
        eyebrow={
          surface === "map" ? "Verified pattern map" : "Authenticated progress"
        }
        title={
          surface === "map"
            ? "Current correction patterns"
            : "Evidence-backed progress"
        }
        description="Only stored assigned work is included. TraceTutor does not estimate an official TOEFL score."
      />
      <div className="mt-7">
        {states?.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {states.map((state) => (
              <Card key={state.id}>
                <Badge tone="violet">{state.status}</Badge>
                <h2 className="mt-3 font-editorial text-2xl capitalize">
                  {state.error_cause_code.replaceAll("-", " ")}
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  {state.recurrence_count} observed recurrence ·{" "}
                  {state.secure_transfer_count} secure transfers
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            eyebrow="No verified patterns yet"
            title="The map starts with evidence"
            description="Complete an assigned correction. A pattern is added only after stored evidence and, where needed, tutor review."
          />
        )}
      </div>
    </div>
  );
}

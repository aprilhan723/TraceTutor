import { randomUUID } from "node:crypto";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAccountRole } from "@/auth/access";
import { savePersonalizedStudyPlanAction } from "@/app/actions/workspace";
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
  const [
    { data: profile },
    { data: plan },
    { data: streak },
    { data: entryDiagnostic },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, target_test_date, onboarding_completed_at")
      .eq("id", account.userId)
      .single(),
    supabase
      .from("learner_study_plans")
      .select("*")
      .eq("learner_id", account.userId)
      .maybeSingle(),
    supabase
      .from("learner_streak_stats")
      .select("current_streak, longest_streak")
      .eq("learner_id", account.userId)
      .maybeSingle(),
    supabase
      .from("entry_reading_diagnostics")
      .select(
        "version, reading_priority, recommended_skill, primary_observation, result",
      )
      .eq("learner_id", account.userId)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!profile) return null;
  if (!entryDiagnostic) redirect("/student/diagnostic" as Route);
  if (!plan?.onboarding_completed_at) {
    const scoreLevels = Array.from(
      { length: 11 },
      (_, index) => 1 + index * 0.5,
    );
    return (
      <div>
        <PageHeader
          eyebrow="Personalized learner onboarding"
          title="Build around the way you actually study."
          description="The ten-minute Daily Core stays available in every plan. These self-reported settings guide practice and never become an official TOEFL score."
        />
        <Card className="mt-7 max-w-4xl">
          <form
            action={savePersonalizedStudyPlanAction}
            className="grid gap-5 sm:grid-cols-2"
          >
            <label className="text-sm font-bold">
              Current practice level
              <select
                className={fieldClass}
                name="currentReadingLevel"
                defaultValue=""
              >
                <option value="">I am not sure</option>
                {scoreLevels.map((score) => (
                  <option key={score} value={score}>
                    {score.toFixed(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold">
              Target Reading score
              <select
                className={fieldClass}
                name="targetReadingScore"
                defaultValue=""
              >
                <option value="">I have not decided yet</option>
                {scoreLevels.map((score) => (
                  <option key={score} value={score}>
                    {score.toFixed(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold">
              Default learning style
              <select
                className={fieldClass}
                name="learningStyle"
                defaultValue="daily-rhythm"
              >
                <option value="daily-rhythm">Daily Rhythm</option>
                <option value="deep-focus">Deep Focus</option>
              </select>
            </label>
            <label className="text-sm font-bold">
              Preferred daily study time
              <select
                className={fieldClass}
                name="defaultDailyMinutes"
                defaultValue="15"
              >
                {[10, 15, 30, 45, 60, 90, 120].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold">
              Study days per week
              <select
                className={fieldClass}
                name="studyDaysPerWeek"
                defaultValue="5"
              >
                {[3, 4, 5, 6, 7].map((days) => (
                  <option key={days}>{days}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold">
              Primary Reading priority
              <select
                className={fieldClass}
                name="readingPriority"
                defaultValue="balanced"
              >
                <option value="balanced">Balanced</option>
                <option value="complete-words">Complete the Words</option>
                <option value="daily-life">Read in Daily Life</option>
                <option value="academic">Academic Reading</option>
                <option value="mistake-review">Mistake Review</option>
              </select>
            </label>
            <label className="text-sm font-bold">
              Target test date <span className="font-normal">(optional)</span>
              <input
                className={fieldClass}
                name="targetTestDate"
                type="date"
                min={getServerNow().toISOString().slice(0, 10)}
              />
            </label>
            <label className="text-sm font-bold">
              Preferred study time{" "}
              <span className="font-normal">(optional)</span>
              <input
                className={fieldClass}
                name="preferredStudyTime"
                type="time"
              />
            </label>
            <label className="text-sm font-bold sm:col-span-2">
              IANA timezone
              <input
                className={fieldClass}
                name="timezone"
                defaultValue="UTC"
                placeholder="Asia/Seoul"
              />
            </label>
            <div className="sm:col-span-2">
              <p className="text-xs leading-5 text-ink-muted">
                Optional fields can stay blank. You can edit the plan later, and
                existing attempts, reviews, transfer results, and tutor links
                remain unchanged.
              </p>
              <Button className="mt-5" type="submit">
                Build my personalized plan
              </Button>
            </div>
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
      {entryDiagnostic.version === "reading-entry-v1" ? (
        <Card tone="violet" className="mt-7">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Badge tone="violet">Diagnostic → first correction</Badge>
              <p className="mt-4 text-xs font-bold tracking-[0.12em] text-violet uppercase">
                Recommended first target ·{" "}
                {entryDiagnostic.reading_priority.replaceAll("_", " ")}
              </p>
              <h2 className="mt-2 font-editorial text-3xl capitalize">
                {entryDiagnostic.recommended_skill.replaceAll("-", " ")}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
                {entryDiagnostic.primary_observation} Your tutor sees the same
                baseline evidence.
              </p>
            </div>
            <Button href="/student/study" size="lg">
              Start my recommended study
            </Button>
          </div>
        </Card>
      ) : null}
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
          <p className="mt-2 font-editorial text-4xl">
            {streak?.current_streak ?? 0} days
          </p>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            Longest {streak?.longest_streak ?? 0}. Authenticated credit is
            derived from qualifying review, correction, transfer, or
            tutor-assigned completion—not login activity.
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

export async function StudentProductionStudyPlan() {
  const account = await requireAccountRole("student");
  if (!account) return null;
  const supabase = await createSupabaseServerClient();
  const { data: plan } = await supabase
    .from("learner_study_plans")
    .select("*")
    .eq("learner_id", account.userId)
    .maybeSingle();
  if (!plan) return <StudentProductionToday />;
  const scoreLevels = Array.from({ length: 11 }, (_, index) => 1 + index * 0.5);
  return (
    <div>
      <PageHeader
        eyebrow="Learner controls"
        title="Study Plan"
        description="Edit future defaults without rewriting historical goals, sessions, responses, or reviews. Tutor recommendations remain visible suggestions, never silent overrides."
      />
      <Card className="mt-7 max-w-4xl">
        <form
          action={savePersonalizedStudyPlanAction}
          className="grid gap-5 sm:grid-cols-2"
        >
          <label className="text-sm font-bold">
            Learning style
            <select
              name="learningStyle"
              className={fieldClass}
              defaultValue={
                plan.learning_style === "deep_focus"
                  ? "deep-focus"
                  : "daily-rhythm"
              }
            >
              <option value="daily-rhythm">Daily Rhythm</option>
              <option value="deep-focus">Deep Focus</option>
            </select>
          </label>
          <label className="text-sm font-bold">
            Default daily minutes
            <input
              name="defaultDailyMinutes"
              className={fieldClass}
              type="number"
              min="10"
              max="120"
              defaultValue={plan.default_daily_minutes}
            />
          </label>
          <label className="text-sm font-bold">
            Weekly active-minute goal
            <input
              name="weeklyGoalMinutes"
              className={fieldClass}
              type="number"
              min="30"
              max="840"
              defaultValue={plan.weekly_goal_minutes}
            />
          </label>
          <label className="text-sm font-bold">
            Study days per week
            <select
              name="studyDaysPerWeek"
              className={fieldClass}
              defaultValue={plan.study_days_per_week}
            >
              {[3, 4, 5, 6, 7].map((days) => (
                <option key={days}>{days}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Current self-reported level
            <select
              name="currentReadingLevel"
              className={fieldClass}
              defaultValue={plan.current_reading_level ?? ""}
            >
              <option value="">I am not sure</option>
              {scoreLevels.map((score) => (
                <option key={score} value={score}>
                  {score.toFixed(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Target Reading score
            <select
              name="targetReadingScore"
              className={fieldClass}
              defaultValue={plan.target_reading_score ?? ""}
            >
              <option value="">I have not decided yet</option>
              {scoreLevels.map((score) => (
                <option key={score} value={score}>
                  {score.toFixed(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Reading priority
            <select
              name="readingPriority"
              className={fieldClass}
              defaultValue={plan.reading_priority.replaceAll("_", "-")}
            >
              <option value="balanced">Balanced</option>
              <option value="complete-words">Complete the Words</option>
              <option value="daily-life">Read in Daily Life</option>
              <option value="academic">Academic Reading</option>
              <option value="mistake-review">Mistake Review</option>
            </select>
          </label>
          <label className="text-sm font-bold">
            Target test date
            <input
              name="targetTestDate"
              className={fieldClass}
              type="date"
              min={getServerNow().toISOString().slice(0, 10)}
              defaultValue={plan.target_test_date ?? ""}
            />
          </label>
          <label className="text-sm font-bold">
            Preferred study time
            <input
              name="preferredStudyTime"
              className={fieldClass}
              type="time"
              defaultValue={plan.preferred_study_time?.slice(0, 5) ?? ""}
            />
          </label>
          <label className="text-sm font-bold">
            IANA timezone
            <input
              name="timezone"
              className={fieldClass}
              defaultValue={plan.timezone}
            />
          </label>
          <div className="rounded-2xl bg-violet-soft p-4 sm:col-span-2">
            <p className="text-xs leading-5 text-ink-muted">
              Reducing future targets does not delete scheduled reviews or
              completed history. Review the new values above before saving.
            </p>
            <Button className="mt-4" type="submit">
              Confirm and save future plan
            </Button>
          </div>
        </form>
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
  const [
    { data: states },
    { data: daily },
    { data: streak },
    { data: sessions },
    { data: plan },
  ] = await Promise.all([
    supabase
      .from("learner_error_states")
      .select(
        "id, error_cause_code, status, recurrence_count, secure_transfer_count",
      )
      .eq("student_id", account.userId),
    supabase
      .from("daily_learner_progress")
      .select(
        "local_date, active_seconds, questions_answered, correct_answers, daily_core_completed",
      )
      .eq("learner_id", account.userId)
      .order("local_date", { ascending: false })
      .limit(30),
    supabase
      .from("learner_streak_stats")
      .select("current_streak, longest_streak")
      .eq("learner_id", account.userId)
      .maybeSingle(),
    supabase
      .from("study_sessions")
      .select(
        "id, planned_minutes, active_seconds, questions_answered, correct_answers, status, topic, created_at",
      )
      .eq("learner_id", account.userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("learner_study_plans")
      .select("weekly_goal_minutes, target_reading_score, target_test_date")
      .eq("learner_id", account.userId)
      .maybeSingle(),
  ]);
  const today = getServerNow().toISOString().slice(0, 10);
  const weekStart = new Date(`${today}T12:00:00.000Z`);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const recentDays = (daily ?? []).filter(
    (entry) => entry.local_date >= weekStart.toISOString().slice(0, 10),
  );
  const weeklyMinutes = Math.round(
    recentDays.reduce((sum, entry) => sum + entry.active_seconds, 0) / 60,
  );
  const totalQuestions = (daily ?? []).reduce(
    (sum, entry) => sum + entry.questions_answered,
    0,
  );
  const totalCorrect = (daily ?? []).reduce(
    (sum, entry) => sum + entry.correct_answers,
    0,
  );
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
      {surface === "progress" ? (
        <section
          className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Authenticated learner progress summary"
        >
          <Card tone="coral">
            <p className="text-xs font-bold text-ink-muted uppercase">
              Correction Streak
            </p>
            <p className="mt-2 font-editorial text-4xl">
              {streak?.current_streak ?? 0} days
            </p>
            <p className="mt-2 text-xs text-ink-muted">
              Longest {streak?.longest_streak ?? 0}
            </p>
          </Card>
          <Card tone="violet">
            <p className="text-xs font-bold text-ink-muted uppercase">
              Weekly active time
            </p>
            <p className="mt-2 font-editorial text-4xl">
              {weeklyMinutes} / {plan?.weekly_goal_minutes ?? 0} min
            </p>
            <p className="mt-2 text-xs text-ink-muted">
              Hidden and idle time is excluded.
            </p>
          </Card>
          <Card tone="mint">
            <p className="text-xs font-bold text-ink-muted uppercase">
              Questions answered
            </p>
            <p className="mt-2 font-editorial text-4xl">{totalQuestions}</p>
            <p className="mt-2 text-xs text-ink-muted">
              {totalQuestions
                ? `${Math.round((totalCorrect / totalQuestions) * 100)}% recent stored accuracy`
                : "Not enough data yet"}
            </p>
          </Card>
          <Card>
            <p className="text-xs font-bold text-ink-muted uppercase">
              Target context
            </p>
            <p className="mt-2 font-editorial text-4xl">
              {plan?.target_reading_score ?? "Not set"}
            </p>
            <p className="mt-2 text-xs text-ink-muted">
              Self-selected practice target · no official score claim
            </p>
          </Card>
        </section>
      ) : null}
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
      {surface === "progress" && sessions?.length ? (
        <section className="mt-8" aria-labelledby="account-session-history">
          <h2 id="account-session-history" className="font-editorial text-3xl">
            Recent study sessions
          </h2>
          <ul className="mt-4 divide-y divide-ink/10 overflow-hidden rounded-3xl border border-ink/10 bg-white">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 p-5"
              >
                <div>
                  <Badge
                    tone={session.status === "completed" ? "mint" : "violet"}
                  >
                    {session.status}
                  </Badge>
                  <p className="mt-2 font-bold capitalize">
                    {session.planned_minutes}-minute{" "}
                    {session.topic.replaceAll("_", " ")}
                  </p>
                </div>
                <p className="text-sm text-ink-muted">
                  {Math.round(session.active_seconds / 60)} active min ·{" "}
                  {session.questions_answered} questions
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAccountRole } from "@/auth/access";
import {
  AssignmentControl,
  CopyDemoContentControl,
  TutorInviteControl,
} from "@/components/production/tutor-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { loadTutorProductionWorkspace } from "@/data/supabase-workspace";

export async function TutorProductionDashboard() {
  const account = await requireAccountRole("tutor");
  if (!account) return null;
  const workspace = await loadTutorProductionWorkspace(account.userId);
  if (!workspace.organization) redirect("/auth/setup");
  const unresolved = workspace.recentAttempts.filter(
    (attempt) => !attempt.isCorrect,
  ).length;
  const highConfidenceWrong = workspace.recentAttempts.filter(
    (attempt) => !attempt.isCorrect && attempt.confidence === "certain",
  ).length;
  return (
    <div>
      <PageHeader
        eyebrow="Authenticated tutor workspace"
        title={workspace.organization.name}
        description="Actions are limited to students explicitly linked to this workspace. Queue signals describe observed work, not psychology."
      />
      <section
        className="mt-7 grid gap-4 sm:grid-cols-3"
        aria-label="Tutor operational counts"
      >
        {[
          ["Linked students", workspace.students.length],
          ["Unresolved responses", unresolved],
          ["High-confidence wrong", highConfidenceWrong],
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
              {label}
            </p>
            <p className="mt-2 font-editorial text-4xl">{value}</p>
          </Card>
        ))}
      </section>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
                Today’s intervention queue
              </p>
              <h2 className="mt-2 font-editorial text-3xl">
                Recent student responses
              </h2>
            </div>
            <Badge tone="violet">RLS linked only</Badge>
          </div>
          {workspace.recentAttempts.length ? (
            <ol className="mt-6 space-y-3">
              {workspace.recentAttempts.map((attempt) => (
                <li
                  key={attempt.id}
                  className="rounded-2xl border border-ink/10 bg-cream p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">
                      {attempt.studentName} · {attempt.assignmentTitle}
                    </p>
                    <Badge tone={attempt.isCorrect ? "mint" : "coral"}>
                      {attempt.isCorrect ? "Correct" : "Needs review"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">
                    {attempt.confidence
                      ? `Confidence: ${attempt.confidence}. `
                      : ""}
                    {attempt.isCorrect
                      ? "Recent corrected work is available for retention planning."
                      : attempt.confidence === "certain"
                        ? "Prioritized because the selected answer was wrong with Certain confidence."
                        : "Prioritized because the response remains unresolved."}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-6">
              <EmptyState
                eyebrow="Queue clear"
                title="No linked student responses yet"
                description="Invite a student and assign one original item. Their submitted response will appear here without exposing another class."
              />
            </div>
          )}
        </Card>
        <div className="space-y-6">
          <Card tone="violet">
            <h2 className="font-editorial text-2xl">Invite one student</h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              The raw code is shown once and only its SHA-256 hash is stored.
            </p>
            <div className="mt-5">
              <TutorInviteControl classes={workspace.classes} />
            </div>
          </Card>
          <Card>
            <h2 className="font-editorial text-2xl">Original content</h2>
            <p className="mt-2 text-sm text-ink-muted">
              {workspace.content.length} published workspace items
            </p>
            <div className="mt-5">
              <CopyDemoContentControl />
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
          Tutor assignment
        </p>
        <h2 className="mt-2 font-editorial text-3xl">
          Send one correction target
        </h2>
        <div className="mt-5 max-w-xl">
          <AssignmentControl
            classes={workspace.classes}
            students={workspace.students}
            content={workspace.content}
          />
        </div>
      </Card>
    </div>
  );
}

export async function TutorProductionStudents() {
  const account = await requireAccountRole("tutor");
  if (!account) return null;
  const workspace = await loadTutorProductionWorkspace(account.userId);
  return (
    <div>
      <PageHeader
        eyebrow="Linked roster"
        title="Students"
        description="Only active tutor–student links in this organization are visible."
      />
      <div className="mt-7 grid gap-4">
        {workspace.students.length ? (
          workspace.students.map((student) => (
            <Card key={student.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-editorial text-2xl">
                    {student.displayName}
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    Test date:{" "}
                    {student.targetTestDate ?? "Onboarding not complete"}
                  </p>
                </div>
                <Link
                  href={`/tutor/students/${student.id}`}
                  className="rounded-full border border-ink/15 px-4 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-violet"
                >
                  View linked record
                </Link>
              </div>
            </Card>
          ))
        ) : (
          <EmptyState
            eyebrow="No linked students"
            title="Your roster is private and empty"
            description="Generate a one-time invitation from Dashboard. A student appears only after redeeming that exact class invitation."
          />
        )}
      </div>
    </div>
  );
}

export async function TutorProductionContent() {
  const account = await requireAccountRole("tutor");
  if (!account) return null;
  const workspace = await loadTutorProductionWorkspace(account.userId);
  return (
    <div>
      <PageHeader
        eyebrow="Independent content library"
        title="Published originals"
        description="Published versions are immutable. Editing requires a new version so past attempts keep their source."
      />
      <Card className="mt-7">
        {workspace.content.length ? (
          <ul className="divide-y divide-ink/10">
            {workspace.content.map((item) => (
              <li
                key={item.itemVersionId}
                className="py-4 first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold capitalize">{item.title}</p>
                    <p className="mt-1 text-sm text-ink-muted">{item.prompt}</p>
                  </div>
                  <Badge tone="mint">Published</Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div>
            <CopyDemoContentControl />
          </div>
        )}
      </Card>
      <p className="mt-5 text-xs leading-5 text-ink-muted">
        All included content is original independent practice material and is
        not official ETS material.
      </p>
    </div>
  );
}

export async function TutorProductionStudentDetail({
  studentId,
}: {
  studentId: string;
}) {
  const account = await requireAccountRole("tutor");
  if (!account) return null;
  const workspace = await loadTutorProductionWorkspace(account.userId);
  const student = workspace.students.find(
    (candidate) => candidate.id === studentId,
  );
  if (!student)
    return (
      <EmptyState
        eyebrow="Not available"
        title="Student not found"
        description="This record is not linked to your active tutor workspace."
      />
    );
  const attempts = workspace.recentAttempts.filter(
    (attempt) => attempt.studentId === student.id,
  );
  return (
    <div>
      <PageHeader
        eyebrow="Linked student"
        title={student.displayName}
        description="Current evidence from this tutor relationship only; no fixed learner personality labels."
      />
      <Card className="mt-7">
        <h2 className="font-editorial text-2xl">Recent intervention history</h2>
        <ul className="mt-4 space-y-3">
          {attempts.map((attempt) => (
            <li key={attempt.id} className="rounded-2xl bg-cream p-4 text-sm">
              {attempt.assignmentTitle} ·{" "}
              {attempt.isCorrect ? "correct" : "waiting for correction"}
            </li>
          ))}
        </ul>
        {!attempts.length ? (
          <p className="mt-4 text-sm text-ink-muted">
            No submitted responses yet.
          </p>
        ) : null}
      </Card>
    </div>
  );
}

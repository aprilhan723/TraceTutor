"use client";

import type { Route } from "next";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useTutorDemo } from "@/components/tutor/tutor-demo-provider";
import { errorCauseLabels } from "@/domain/mistake-intelligence";

export function StudentDetail({ studentId }: { studentId: string }) {
  const { hydrated, bundle, saveStudentNotes } = useTutorDemo();
  const profile = bundle?.workspace.studentProfiles.find(
    (candidate) => candidate.studentId === studentId,
  );
  const student = bundle?.students.find(
    (candidate) => candidate.id === studentId,
  );
  const [notes, setNotes] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!hydrated)
    return (
      <div
        className="h-96 animate-pulse rounded-[2rem] bg-white motion-reduce:animate-none"
        aria-label="Loading student profile"
      />
    );
  if (!bundle || !profile || !student)
    return (
      <Card>
        <h1 className="font-editorial text-3xl">Student not found</h1>
      </Card>
    );
  const notesValue = notes ?? profile.tutorNotes;

  const cases = bundle.workspace.diagnosisCases.filter(
    (item) => item.studentId === studentId,
  );
  const reviewCalendar = cases.flatMap((item) =>
    item.retentionHistory.map((review) => ({
      ...review,
      patternLabel: item.patternLabel,
    })),
  );
  const interventions = cases.flatMap((item) =>
    item.auditTrail.map((event) => ({
      ...event,
      patternLabel: item.patternLabel,
    })),
  );
  const weekly = bundle.weeklyReport;

  return (
    <div>
      <PageHeader
        eyebrow="Student workspace · Pattern evidence"
        title={student.name}
        description={`Target test ${profile.targetTestDate}. Current signals describe recent work and can change; they are not personality labels.`}
        action={
          <Button
            href={`/tutor/students/${studentId}/lesson-brief` as Route}
            variant="violet"
          >
            Next lesson brief →
          </Button>
        }
      />

      <section
        className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Student learning signals"
      >
        <Card tone="mint">
          <p className="text-xs font-bold text-mint-deep uppercase">
            Evidence accuracy
          </p>
          <p className="mt-3 font-editorial text-4xl font-bold">
            {profile.evidenceAccuracy}%
          </p>
        </Card>
        <Card tone="violet">
          <p className="text-xs font-bold text-violet uppercase">
            Confidence calibration
          </p>
          <p className="mt-3 font-editorial text-4xl font-bold">
            {profile.confidenceCalibration}%
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            +
            {profile.confidenceCalibration -
              profile.previousConfidenceCalibration}{" "}
            points
          </p>
        </Card>
        <Card>
          <p className="text-xs font-bold text-ink-muted uppercase">
            Open interventions
          </p>
          <p className="mt-3 font-editorial text-4xl font-bold">
            {
              cases.filter((item) =>
                ["pending", "in-review", "ambiguous"].includes(
                  item.adjudication.status,
                ),
              ).length
            }
          </p>
        </Card>
        <Card tone="coral">
          <p className="text-xs font-bold text-coral-deep uppercase">
            Test date
          </p>
          <p className="mt-3 font-editorial text-3xl font-bold">Sep 15</p>
          <p className="mt-1 text-xs text-ink-muted">Planning context only</p>
        </Card>
      </section>

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-violet uppercase">
                  Recent adherence
                </p>
                <h2 className="mt-1 font-editorial text-3xl font-bold">
                  10-day correction rhythm
                </h2>
              </div>
              <Badge tone="neutral">
                {
                  profile.adherence.filter((day) => day.status !== "missed")
                    .length
                }
                /10 kept
              </Badge>
            </div>
            <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-10">
              {profile.adherence.map((day) => (
                <div
                  key={day.dateKey}
                  className={`rounded-xl border p-2 text-center ${day.status === "completed" ? "border-mint-deep/20 bg-mint" : day.status === "recovery" ? "border-violet/20 bg-violet-soft" : "border-coral/20 bg-coral-soft"}`}
                >
                  <p className="text-[0.65rem] font-bold">
                    {day.dateKey.slice(5)}
                  </p>
                  <p className="mt-2 text-lg" aria-hidden="true">
                    {day.status === "completed"
                      ? "✓"
                      : day.status === "recovery"
                        ? "↺"
                        : "—"}
                  </p>
                  <span className="sr-only">{day.status}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-editorial text-3xl font-bold">
              Top current patterns
            </h2>
            <div className="mt-5 space-y-3">
              {cases
                .slice()
                .sort(
                  (left, right) => right.recurrenceCount - left.recurrenceCount,
                )
                .slice(0, 4)
                .map((item) => {
                  const cause =
                    item.adjudication.primaryCause ??
                    item.machineSuggestion.primaryCause;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-2xl border border-ink/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-bold">
                          {cause ? errorCauseLabels[cause] : item.patternLabel}
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                          {item.recurrenceCount} observations ·{" "}
                          {item.adjudication.status.replace("-", " ")}
                        </p>
                      </div>
                      <Button
                        href={`/tutor/review/${item.id}` as Route}
                        variant="secondary"
                        size="sm"
                      >
                        Inspect
                      </Button>
                    </div>
                  );
                })}
            </div>
          </Card>

          <Card>
            <h2 className="font-editorial text-3xl font-bold">Task coverage</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {Object.entries(profile.taskCoverage).map(([task, count]) => (
                <div key={task} className="rounded-2xl bg-cream p-4">
                  <p className="text-xs font-bold text-ink-muted uppercase">
                    {task.replaceAll("-", " ")}
                  </p>
                  <p className="mt-2 font-editorial text-3xl font-bold">
                    {count}
                  </p>
                  <p className="text-xs text-ink-muted">items seen</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-editorial text-3xl font-bold">
              Review calendar
            </h2>
            <div className="mt-4 divide-y divide-ink/10">
              {reviewCalendar
                .slice()
                .sort((left, right) =>
                  left.dueDate.localeCompare(right.dueDate),
                )
                .map((review, index) => (
                  <div
                    key={`${review.itemId}-${review.cadence}-${index}`}
                    className="grid gap-2 py-3 text-sm sm:grid-cols-[6rem_1fr_auto]"
                  >
                    <p className="font-bold">{review.dueDate.slice(5)}</p>
                    <p>
                      {review.patternLabel} · {review.cadence}
                    </p>
                    <Badge
                      tone={
                        review.outcome === "secure"
                          ? "mint"
                          : review.outcome === "needs-work"
                            ? "coral"
                            : "neutral"
                      }
                    >
                      {review.outcome.replace("-", " ")}
                    </Badge>
                  </div>
                ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card tone="violet">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-violet uppercase">
                Student-facing weekly summary
              </p>
              <Badge tone="mint">Preview</Badge>
            </div>
            <p className="mt-4 font-editorial text-4xl font-bold">
              {weekly.missionsCompleted}
            </p>
            <p className="text-sm text-ink-muted">
              missions completed this week
            </p>
            <p className="mt-4 text-sm font-bold">
              {weekly.verifiedCorrections} verified corrections
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              Next focus:{" "}
              {weekly.nextWeekFocus.join(", ") || "Tutor review in progress"}.
            </p>
            <Button
              href="/student/weekly-report"
              variant="secondary"
              size="sm"
              className="mt-5 w-full"
            >
              Open student preview →
            </Button>
          </Card>

          <Card>
            <h2 className="font-editorial text-2xl font-bold">
              Tutor-only notes
            </h2>
            <p className="mt-2 text-xs leading-5 text-ink-muted">
              Never shown in the student weekly report.
            </p>
            <label htmlFor="tutor-notes" className="sr-only">
              Tutor-only notes
            </label>
            <textarea
              id="tutor-notes"
              rows={7}
              value={notesValue}
              onChange={(event) => {
                setNotes(event.target.value);
                setSaved(false);
              }}
              className="mt-4 w-full rounded-xl border border-ink/15 bg-cream/40 p-3 text-sm leading-6"
            />
            <Button
              className="mt-3 w-full"
              variant="secondary"
              size="sm"
              onClick={async () => {
                await saveStudentNotes(studentId, notesValue);
                setSaved(true);
              }}
            >
              Save private notes
            </Button>
            {saved ? (
              <p
                role="status"
                className="mt-2 text-center text-xs font-bold text-mint-deep"
              >
                Private notes saved
              </p>
            ) : null}
          </Card>

          <Card>
            <h2 className="font-editorial text-2xl font-bold">
              Intervention history
            </h2>
            <ol className="mt-4 space-y-3">
              {interventions
                .slice()
                .sort((left, right) =>
                  right.createdAt.localeCompare(left.createdAt),
                )
                .slice(0, 6)
                .map((event) => (
                  <li
                    key={event.id}
                    className="border-l-2 border-violet/20 pl-3 text-sm leading-6"
                  >
                    <p className="font-bold">{event.patternLabel}</p>
                    <p className="text-ink-muted">{event.summary}</p>
                  </li>
                ))}
            </ol>
          </Card>
        </aside>
      </div>
    </div>
  );
}

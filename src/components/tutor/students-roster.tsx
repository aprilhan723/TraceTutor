"use client";

import type { Route } from "next";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useTutorDemo } from "@/components/tutor/tutor-demo-provider";
import { errorCauseLabels } from "@/domain/mistake-intelligence";

export function StudentsRoster() {
  const { hydrated, bundle } = useTutorDemo();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "needs-review" | "on-track">(
    "all",
  );

  const students = useMemo(() => {
    if (!bundle) return [];
    return bundle.students.filter((student) => {
      const matchesQuery = student.name
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase());
      const needsReview = bundle.dashboard.queue.some(
        (item) => item.studentId === student.id,
      );
      const matchesStatus =
        status === "all" ||
        (status === "needs-review" ? needsReview : !needsReview);
      return matchesQuery && matchesStatus;
    });
  }, [bundle, query, status]);

  if (!hydrated || !bundle) {
    return (
      <div
        className="h-80 animate-pulse rounded-[2rem] bg-white motion-reduce:animate-none"
        aria-label="Loading student roster"
      />
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Student roster · Current patterns"
        title="Students"
        description="Search a growing roster without turning current correction patterns into fixed personality labels."
        action={
          <Badge tone="violet">{bundle.students.length} active student</Badge>
        }
      />

      <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-4 sm:flex-row">
        <label className="flex-1 text-xs font-bold uppercase">
          Search students
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name"
            className="mt-2 min-h-12 w-full rounded-xl border border-ink/15 bg-cream/40 px-4 text-sm font-normal normal-case"
          />
        </label>
        <label className="text-xs font-bold uppercase sm:w-56">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="mt-2 min-h-12 w-full rounded-xl border border-ink/15 bg-cream/40 px-3 text-sm font-normal normal-case"
          >
            <option value="all">All students</option>
            <option value="needs-review">Needs review</option>
            <option value="on-track">On track</option>
          </select>
        </label>
      </div>

      <div className="mt-6 space-y-4">
        {students.map((student) => {
          const profile = bundle.workspace.studentProfiles.find(
            (candidate) => candidate.studentId === student.id,
          );
          const cases = bundle.workspace.diagnosisCases.filter(
            (item) => item.studentId === student.id,
          );
          const activeCases = cases.filter((item) =>
            ["pending", "in-review", "ambiguous"].includes(
              item.adjudication.status,
            ),
          );
          const recent = profile?.adherence.slice(-7) ?? [];
          const completed = recent.filter(
            (day) => day.status !== "missed",
          ).length;
          const topPatterns = cases
            .slice()
            .sort((left, right) => right.recurrenceCount - left.recurrenceCount)
            .slice(0, 3);
          return (
            <Card key={student.id} className="overflow-hidden p-0">
              <div className="p-5 sm:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <span className="grid size-14 shrink-0 place-items-center rounded-full bg-mint font-bold text-mint-deep">
                      {student.initials}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-editorial text-3xl font-bold">
                          {student.name}
                        </h2>
                        <Badge tone={activeCases.length ? "coral" : "mint"}>
                          {activeCases.length
                            ? `${activeCases.length} need review`
                            : "On track"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-ink-muted">
                        Target test {profile?.targetTestDate ?? "Not set"} ·{" "}
                        {completed}/{recent.length} recent missions kept
                      </p>
                    </div>
                  </div>
                  <Button
                    href={`/tutor/students/${student.id}` as Route}
                    variant="secondary"
                  >
                    Open student →
                  </Button>
                </div>
                <div className="mt-6 grid gap-5 border-t border-ink/10 pt-5 md:grid-cols-[1fr_auto]">
                  <div>
                    <p className="text-xs font-bold tracking-wide text-violet uppercase">
                      Top current patterns
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {topPatterns.map((item) => {
                        const cause =
                          item.adjudication.primaryCause ??
                          item.machineSuggestion.primaryCause;
                        return (
                          <Badge key={item.id} tone="violet">
                            {cause
                              ? errorCauseLabels[cause]
                              : item.patternLabel}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <dl className="flex gap-6 text-sm">
                    <div>
                      <dt className="text-xs font-bold text-ink-muted uppercase">
                        Evidence
                      </dt>
                      <dd className="mt-1 font-editorial text-2xl font-bold">
                        {profile?.evidenceAccuracy ?? 0}%
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold text-ink-muted uppercase">
                        Calibration
                      </dt>
                      <dd className="mt-1 font-editorial text-2xl font-bold">
                        {profile?.confidenceCalibration ?? 0}%
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

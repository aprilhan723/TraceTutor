"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useTutorDemo } from "@/components/tutor/tutor-demo-provider";

function PatternList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "mint" | "coral" | "violet";
}) {
  return (
    <Card tone={tone}>
      <h2 className="font-editorial text-2xl font-bold">{title}</h2>
      {items.length ? (
        <ul className="mt-4 space-y-2 text-sm leading-6">
          {items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">
          Nothing in this category yet.
        </p>
      )}
    </Card>
  );
}

export function WeeklyReportView() {
  const { hydrated, bundle } = useTutorDemo();
  if (!hydrated || !bundle)
    return (
      <div
        className="h-96 animate-pulse rounded-[2rem] bg-white motion-reduce:animate-none"
        aria-label="Loading weekly report"
      />
    );
  const report = bundle.weeklyReport;
  const student = bundle.students[0];

  return (
    <div>
      <PageHeader
        eyebrow={`Weekly correction report · ${report.periodLabel}`}
        title={`${student?.name.split(" ")[0] ?? "Student"}, here’s what changed`}
        description="A tutor-verified summary of corrections that are holding, returning, or still waiting for a human look."
        action={<Badge tone="mint">Student-facing</Badge>}
      />

      <section
        className="mt-8 grid gap-4 sm:grid-cols-3"
        aria-label="Weekly report totals"
      >
        <Card tone="violet">
          <p className="text-xs font-bold text-violet uppercase">
            Missions completed
          </p>
          <p className="mt-3 font-editorial text-5xl font-bold">
            {report.missionsCompleted}
          </p>
        </Card>
        <Card tone="mint">
          <p className="text-xs font-bold text-mint-deep uppercase">
            Verified corrections
          </p>
          <p className="mt-3 font-editorial text-5xl font-bold">
            {report.verifiedCorrections}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-bold text-ink-muted uppercase">
            Calibration change
          </p>
          <p className="mt-3 font-editorial text-5xl font-bold">
            +{report.confidenceCalibrationChange}
          </p>
          <p className="mt-1 text-xs text-ink-muted">percentage points</p>
        </Card>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <PatternList title="Improving" items={report.improving} tone="mint" />
        <PatternList title="Recurring" items={report.recurring} tone="coral" />
        <PatternList
          title="Waiting for tutor review"
          items={report.waitingForReview}
          tone="violet"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <p className="text-xs font-bold text-violet uppercase">
            Next week’s focus
          </p>
          <h2 className="mt-2 font-editorial text-3xl font-bold">
            Keep the correction narrow
          </h2>
          <ol className="mt-5 space-y-3">
            {report.nextWeekFocus.length ? (
              report.nextWeekFocus.map((focus, index) => (
                <li
                  key={focus}
                  className="flex gap-3 rounded-xl bg-violet-soft p-4 text-sm"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-violet font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-1 font-semibold">{focus}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-ink-muted">
                Your tutor is reviewing the next focus.
              </li>
            )}
          </ol>
        </Card>
        <Card tone="mint">
          <p className="text-xs font-bold text-mint-deep uppercase">
            Latest tutor feedback
          </p>
          {report.latestFeedback.length ? (
            report.latestFeedback.map((feedback) => (
              <blockquote
                key={feedback}
                className="mt-4 border-l-4 border-mint-deep pl-4 font-editorial text-xl leading-8"
              >
                {feedback}
              </blockquote>
            ))
          ) : (
            <p className="mt-4 text-sm leading-6 text-ink-muted">
              Verified feedback will appear after the tutor completes the
              review.
            </p>
          )}
        </Card>
      </div>

      {report.approvedAiExplanations.length ? (
        <Card className="mt-6" tone="violet">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-violet uppercase">
                Tutor-approved explanation
              </p>
              <h2 className="mt-2 font-editorial text-2xl font-bold">
                A cautious way to name the pattern
              </h2>
            </div>
            <Badge tone="mint">Human verified</Badge>
          </div>
          {report.approvedAiExplanations.map((explanation) => (
            <p
              key={explanation}
              className="mt-4 max-w-3xl text-sm leading-7 text-ink-muted"
            >
              {explanation}
            </p>
          ))}
          <p className="mt-3 text-xs leading-5 text-ink-muted">
            Optional AI assisted with the draft; it appears here only because it
            matches the tutor’s completed adjudication.
          </p>
        </Card>
      ) : null}

      <div className="mt-7 flex flex-col items-start justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-5 sm:flex-row sm:items-center">
        <p className="max-w-2xl text-sm leading-6 text-ink-muted">
          This report tracks practice and verified correction behavior only. It
          is not an official TOEFL score, prediction, or ETS-endorsed report.
        </p>
        <Button href="/student/today" variant="secondary">
          Back to Today
        </Button>
      </div>
    </div>
  );
}

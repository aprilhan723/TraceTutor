"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTutorDemo } from "@/components/tutor/tutor-demo-provider";

export function LessonBrief({ studentId }: { studentId: string }) {
  const { hydrated, bundle, saveLessonNotes } = useTutorDemo();
  const [notes, setNotes] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const brief =
    bundle?.lessonBrief.studentId === studentId ? bundle.lessonBrief : null;
  const student = bundle?.students.find(
    (candidate) => candidate.id === studentId,
  );

  if (!hydrated || !bundle)
    return (
      <div
        className="h-96 animate-pulse rounded-[2rem] bg-white motion-reduce:animate-none"
        aria-label="Loading lesson brief"
      />
    );
  if (!brief || !student)
    return (
      <Card>
        <h1 className="font-editorial text-3xl">Lesson brief unavailable</h1>
      </Card>
    );
  const notesValue = notes ?? brief.tutorNotes;

  return (
    <article className="lesson-brief-print mx-auto max-w-5xl">
      <header className="flex flex-col gap-5 border-b border-ink/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.15em] text-violet uppercase">
            Next lesson brief · Verified data
          </p>
          <h1 className="mt-2 font-editorial text-5xl tracking-[-0.04em]">
            {student.name}
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            A focused 10–15 minute intervention plan generated from reviewed
            correction evidence.
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <Button
            href={`/tutor/students/${studentId}` as Route}
            variant="secondary"
          >
            ← Student
          </Button>
          <Button onClick={() => window.print()} variant="violet">
            Export to print
          </Button>
        </div>
      </header>

      <section className="mt-8" aria-labelledby="brief-priorities">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="brief-priorities"
            className="font-editorial text-3xl font-bold"
          >
            Priority patterns
          </h2>
          <Badge tone="violet">{brief.priorities.length} selected</Badge>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {brief.priorities.map((priority, index) => (
            <Card key={priority.cause} tone={index === 0 ? "coral" : "violet"}>
              <p className="text-xs font-bold uppercase">
                Priority {index + 1}
              </p>
              <h3 className="mt-2 font-editorial text-2xl font-bold">
                {priority.label}
              </h3>
              <p className="mt-4 text-xs font-bold uppercase">Evidence</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-ink-muted">
                {priority.evidence.map((evidence) => (
                  <li key={evidence}>• {evidence}</li>
                ))}
              </ul>
              <p className="mt-4 border-t border-ink/10 pt-4 text-sm leading-6 font-semibold">
                {priority.intervention}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <h2 className="font-editorial text-3xl font-bold">
            Two ready prompts
          </h2>
          <div className="mt-4 space-y-4">
            {brief.itemLinks.map((item, index) => (
              <div
                key={item.href}
                className="rounded-2xl border border-ink/10 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-violet uppercase">
                    Prompt {index + 1}
                  </p>
                  <Link
                    href={item.href as Route}
                    className="no-print text-xs font-bold text-violet underline"
                  >
                    Open item
                  </Link>
                </div>
                <p className="mt-2 font-bold">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  {item.prompt}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card tone="mint">
            <h2 className="font-editorial text-2xl font-bold">
              Mastered topics to skip
            </h2>
            {brief.masteredTopicsToSkip.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {brief.masteredTopicsToSkip.map((topic) => (
                  <li key={topic}>✓ {topic}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">
                No Day 7 pattern is ready to skip yet.
              </p>
            )}
          </Card>
          <Card tone="coral">
            <h2 className="font-editorial text-2xl font-bold">
              Unresolved questions
            </h2>
            {brief.unresolvedQuestions.length ? (
              <ul className="mt-3 space-y-2 text-sm leading-6">
                {brief.unresolvedQuestions.map((question) => (
                  <li key={question}>• {question}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">
                No unresolved student questions.
              </p>
            )}
          </Card>
        </div>
      </div>

      <Card className="mt-7">
        <h2 className="font-editorial text-3xl font-bold">
          Tutor-editable lesson notes
        </h2>
        <label htmlFor="lesson-notes" className="sr-only">
          Tutor-editable lesson notes
        </label>
        <textarea
          id="lesson-notes"
          rows={7}
          value={notesValue}
          onChange={(event) => {
            setNotes(event.target.value);
            setSaved(false);
          }}
          className="mt-4 w-full rounded-2xl border border-ink/15 bg-cream/40 p-4 text-sm leading-7"
        />
        <div className="no-print mt-3 flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={async () => {
              await saveLessonNotes(studentId, notesValue);
              setSaved(true);
            }}
          >
            Save lesson notes
          </Button>
          {saved ? (
            <span role="status" className="text-xs font-bold text-mint-deep">
              Saved locally
            </span>
          ) : null}
        </div>
      </Card>

      <footer className="mt-8 border-t border-ink/10 pt-4 text-xs leading-5 text-ink-muted">
        TraceTutor is independent practice software, not endorsed by ETS. This
        lesson brief contains instructional signals, not an official TOEFL
        score.
      </footer>
    </article>
  );
}

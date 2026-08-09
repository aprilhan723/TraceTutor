import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { taskCoverage } from "@/content/marketing";

const correctionLoop = [
  ["01", "Answer", "Commit to a choice"],
  ["02", "Evidence", "Trace the exact proof"],
  ["03", "Diagnose", "Name why it went wrong"],
  ["04", "Transfer", "Try the fix in new context"],
  ["05", "Retain", "Revisit before it fades"],
] as const;

const studentBenefits = [
  "A ten-minute mission shaped by your repeating mistake",
  "Evidence tracing before explanations reveal the answer",
  "Transfer practice that checks whether the correction stuck",
] as const;

const tutorBenefits = [
  "See recurring reasoning patterns, not just wrong-answer counts",
  "Review evidence traces before the next lesson",
  "Prioritize the student who needs an intervention today",
] as const;

export default function HomePage() {
  return (
    <div className="overflow-x-clip bg-cream text-ink">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-[60] -translate-y-24 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/90 backdrop-blur-xl">
        <nav
          className="mx-auto flex min-h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          <BrandMark />
          <div className="hidden items-center gap-7 text-sm font-semibold text-ink-muted md:flex">
            <a className="transition-colors hover:text-ink" href="#method">
              The method
            </a>
            <a className="transition-colors hover:text-ink" href="#students">
              For students
            </a>
            <a className="transition-colors hover:text-ink" href="#tutors">
              For tutors
            </a>
          </div>
          <Button href="/demo" variant="secondary" size="sm">
            Explore demo <span aria-hidden="true">↗</span>
          </Button>
        </nav>
      </header>

      <main id="main-content">
        <section className="relative isolate min-h-[calc(100dvh-4.5rem)] overflow-hidden">
          <div
            className="marketing-grid absolute inset-0 -z-20"
            aria-hidden="true"
          />
          <div
            className="absolute top-24 -right-24 -z-10 size-80 rounded-full bg-coral/20 blur-3xl lg:size-[32rem]"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-28 -left-24 -z-10 size-72 rounded-full bg-violet/15 blur-3xl lg:size-[28rem]"
            aria-hidden="true"
          />

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-18 sm:px-6 sm:py-24 lg:grid-cols-[1.06fr_0.94fr] lg:px-8 lg:py-28">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-[0.68rem] font-bold tracking-[0.14em] text-ink-muted uppercase shadow-sm">
                <span
                  className="size-2 rounded-full bg-violet"
                  aria-hidden="true"
                />
                TOEFL Reading Correction Sprint
              </p>
              <h1 className="mt-8 max-w-3xl font-editorial text-[clamp(3.6rem,9vw,7.7rem)] leading-[0.84] tracking-[-0.06em] text-balance">
                Practice less{" "}
                <span className="text-coral-deep italic">randomly.</span>
                <br />
                Correct what keeps repeating.
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-8 text-ink-muted sm:text-xl">
                Ten focused minutes to stop repeating the same Reading
                mistake—then a clear trace your tutor can review before the next
                lesson.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button href="/student/today" size="lg">
                  Try the student demo <span aria-hidden="true">→</span>
                </Button>
                <Button href="/tutor/dashboard" variant="secondary" size="lg">
                  See the tutor view
                </Button>
              </div>
              <p className="mt-6 max-w-xl text-xs leading-5 text-ink-muted">
                Independent practice software. Not endorsed by ETS. Practice
                feedback is not an official TOEFL score.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-[34rem] lg:mx-0 lg:ml-auto">
              <div
                className="hero-orbit absolute top-1/2 left-1/2 -z-10 size-[27rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-violet/30 sm:size-[34rem]"
                aria-hidden="true"
              >
                <span className="absolute top-7 left-12 size-4 rounded-full bg-coral" />
                <span className="absolute right-4 bottom-24 size-7 rounded-lg bg-mint-deep" />
              </div>
              <div className="soft-float relative rotate-[-2.5deg] rounded-[2.25rem] border border-ink/10 bg-paper p-5 shadow-[0_30px_80px_rgba(36,31,28,0.16)] sm:p-7">
                <div className="flex items-center justify-between border-b border-ink/10 pb-5">
                  <div>
                    <p className="text-[0.65rem] font-bold tracking-[0.16em] text-violet uppercase">
                      Today’s trace
                    </p>
                    <p className="mt-1 font-editorial text-2xl font-bold">
                      Evidence drift
                    </p>
                  </div>
                  <span className="grid size-12 place-items-center rounded-full bg-violet-soft font-editorial text-lg font-bold text-violet">
                    01
                  </span>
                </div>
                <div className="paper-rule mt-5 min-h-56 rounded-2xl bg-cream/60 p-5">
                  <p className="text-sm leading-8 text-ink-muted">
                    The passage states that early coastal settlements expanded
                    when seasonal routes made trade more predictable...
                  </p>
                  <div className="mt-4 rounded-xl border-l-4 border-violet bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-bold tracking-wide text-violet uppercase">
                      Trace the proof
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      Which exact phrase supports your answer?
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="rounded-full bg-mint px-3 py-2 text-xs font-bold text-mint-deep">
                    Tutor-verified pattern
                  </span>
                  <span className="text-xs font-semibold text-ink-muted">
                    ≈ 10 min
                  </span>
                </div>
              </div>
              <div className="soft-float-delayed absolute -right-2 -bottom-8 rotate-3 rounded-2xl bg-violet px-5 py-4 text-white shadow-xl sm:-right-8">
                <p className="text-[0.62rem] font-bold tracking-[0.15em] text-white/65 uppercase">
                  Correction signal
                </p>
                <p className="mt-1 font-editorial text-xl">
                  Proof before plausibility.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-y border-ink/10 bg-paper"
          aria-label="Product principles"
        >
          <div className="mx-auto grid max-w-7xl divide-y divide-ink/10 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
            {[
              ["10 min", "A focused daily correction"],
              ["1 pattern", "A mistake worth interrupting"],
              ["2 views", "Student action, tutor clarity"],
            ].map(([value, label]) => (
              <div
                key={value}
                className="flex items-center gap-4 py-6 sm:justify-center sm:px-5"
              >
                <span className="font-editorial text-3xl font-bold text-violet">
                  {value}
                </span>
                <span className="max-w-32 text-xs leading-5 font-bold tracking-wide text-ink-muted uppercase">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section
          id="method"
          className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
        >
          <SectionHeading
            eyebrow="The correction loop"
            title="A wrong answer becomes useful only when you can trace it."
            description="TraceTutor turns one miss into a short, visible learning loop—so the correction survives outside the explanation screen."
          />
          <ol className="relative mt-14 grid gap-4 md:grid-cols-5">
            {correctionLoop.map(([number, title, detail], index) => (
              <li key={title} className="relative">
                <Card
                  tone={index === 2 ? "violet" : index === 4 ? "mint" : "paper"}
                  className="relative h-full min-h-48 overflow-hidden"
                >
                  <span
                    className="font-editorial text-5xl text-ink/10"
                    aria-hidden="true"
                  >
                    {number}
                  </span>
                  <h3 className="mt-5 font-editorial text-2xl font-bold">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {detail}
                  </p>
                  {index < correctionLoop.length - 1 ? (
                    <span
                      className="absolute right-4 bottom-4 text-lg font-bold text-coral-deep md:-right-3 md:bottom-1/2 md:z-10"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  ) : null}
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-ink/10 bg-cream-deep/65">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <SectionHeading
              eyebrow="Why more questions are not enough"
              title="Volume finds a score. Correction changes the pattern."
              align="center"
            />
            <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-2">
              <Card className="p-7 sm:p-9">
                <p className="text-xs font-bold tracking-[0.16em] text-ink-muted uppercase">
                  The question-bank loop
                </p>
                <h3 className="mt-4 font-editorial text-3xl">
                  Answer. Check. Move on.
                </h3>
                <ul className="mt-8 space-y-5 text-sm leading-6 text-ink-muted">
                  {[
                    "More volume, little diagnosis",
                    "Explanations disappear after review",
                    "Tutors see results after the pattern repeats",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-1 text-coral-deep" aria-hidden="true">
                        ×
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card
                tone="violet"
                className="relative overflow-hidden p-7 sm:p-9"
              >
                <div
                  className="absolute -top-12 -right-12 size-36 rounded-full border-[24px] border-violet/10"
                  aria-hidden="true"
                />
                <p className="text-xs font-bold tracking-[0.16em] text-violet uppercase">
                  The TraceTutor loop
                </p>
                <h3 className="mt-4 font-editorial text-3xl">
                  Answer. Trace. Correct. Return.
                </h3>
                <ul className="mt-8 space-y-5 text-sm leading-6 text-ink-muted">
                  {[
                    "One recurring pattern becomes the target",
                    "A transfer check proves the correction",
                    "Tutors see the reasoning before the lesson",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-1 text-mint-deep" aria-hidden="true">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </section>

        <section id="students" className="bg-ink text-white">
          <div className="mx-auto grid max-w-7xl gap-14 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2 lg:items-center lg:px-8">
            <div>
              <SectionHeading
                eyebrow="For students"
                title="Know the one thing today’s practice is meant to fix."
                description="No endless set. No vague review. Your sprint points to a repeated Reading mistake and gives you a small place to correct it."
                invert
              />
              <ul className="mt-9 space-y-5">
                {studentBenefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex gap-4 text-sm leading-6 text-white/75 sm:text-base"
                  >
                    <span
                      className="grid size-7 shrink-0 place-items-center rounded-full bg-mint text-xs font-black text-mint-deep"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <Button href="/student/today" className="mt-10" size="lg">
                Open today’s mission <span aria-hidden="true">→</span>
              </Button>
            </div>

            <div className="rounded-[2.4rem] bg-white p-4 text-ink shadow-2xl sm:p-6">
              <div className="rounded-[1.8rem] bg-cream p-5 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-coral-soft px-3 py-2 text-[0.65rem] font-bold tracking-wider text-coral-deep uppercase">
                    Today · 10 min
                  </span>
                  <span className="text-sm font-bold">0 / 3</span>
                </div>
                <h3 className="mt-7 font-editorial text-3xl sm:text-4xl">
                  Trace the sentence that proves it.
                </h3>
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  Focus: Evidence drift · Read an Academic Passage
                </p>
                <div className="mt-7 h-2 rounded-full bg-ink/10">
                  <div className="h-full w-[8%] rounded-full bg-coral" />
                </div>
                <div className="mt-7 space-y-3">
                  {[
                    "Answer one item",
                    "Trace the exact evidence",
                    "Transfer the correction",
                  ].map((step, index) => (
                    <div
                      key={step}
                      className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-4"
                    >
                      <span
                        className={`grid size-8 place-items-center rounded-full text-xs font-bold ${index === 0 ? "bg-violet text-white" : "bg-ink/5 text-ink-muted"}`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="tutors" className="relative overflow-hidden">
          <div
            className="absolute -top-28 right-0 -z-10 size-[30rem] rounded-full bg-violet/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="mx-auto grid max-w-7xl gap-14 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <Card tone="violet" className="order-2 p-5 sm:p-7 lg:order-1">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet/15 pb-5">
                <div>
                  <p className="text-xs font-bold tracking-[0.14em] text-violet uppercase">
                    Intervention queue
                  </p>
                  <h3 className="mt-1 font-editorial text-2xl">
                    What needs a human eye
                  </h3>
                </div>
                <span className="rounded-full bg-white px-3 py-2 text-xs font-bold">
                  1 priority
                </span>
              </div>
              <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint font-bold text-mint-deep">
                      JP
                    </span>
                    <div>
                      <p className="font-bold">Jamie Park</p>
                      <p className="mt-1 text-xs text-ink-muted">
                        Evidence drift · 3 recurrences
                      </p>
                    </div>
                  </div>
                  <span
                    className="size-2.5 rounded-full bg-coral"
                    aria-label="High priority"
                  />
                </div>
                <p className="mt-5 border-l-2 border-violet pl-4 text-sm leading-6 text-ink-muted">
                  Jamie’s answer is plausible, but the selected evidence
                  supports the paragraph topic—not the claim.
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4 text-xs font-bold">
                  <span>Review trace</span>
                  <span aria-hidden="true">→</span>
                </div>
              </div>
            </Card>

            <div className="order-1 lg:order-2">
              <SectionHeading
                eyebrow="For tutors"
                title="See why a student is stuck before the next lesson."
                description="A compact intervention queue surfaces the students, patterns, and evidence traces worth your limited attention."
              />
              <ul className="mt-9 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {tutorBenefits.map((benefit, index) => (
                  <li
                    key={benefit}
                    className="flex gap-4 border-t border-ink/10 pt-4 text-sm leading-6 text-ink-muted"
                  >
                    <span className="font-editorial text-xl font-bold text-violet">
                      0{index + 1}
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <Button
                href="/tutor/dashboard"
                variant="violet"
                className="mt-10"
                size="lg"
              >
                See the tutor view <span aria-hidden="true">→</span>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-y border-ink/10 bg-paper">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <SectionHeading
              eyebrow="2026 Reading task coverage"
              title="Correction that follows the Reading experience students now face."
              description="Each task family needs a different diagnostic lens. TraceTutor keeps the correction method consistent while changing the evidence students must notice."
            />
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {taskCoverage.map((task, index) => (
                <Card
                  key={task.type}
                  className="group min-h-72 p-7 transition-transform duration-300 hover:-translate-y-1 sm:p-8"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-editorial text-5xl text-violet/20">
                      0{index + 1}
                    </span>
                    <span
                      className={`block size-10 ${index === 0 ? "rotate-12 rounded-xl bg-coral" : index === 1 ? "rounded-full border-[10px] border-mint-deep" : "rotate-45 rounded-lg bg-violet"}`}
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mt-9 font-editorial text-3xl tracking-tight">
                    {task.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-ink-muted">
                    {task.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card tone="mint" className="p-7 sm:p-10">
              <p className="text-xs font-bold tracking-[0.16em] text-mint-deep uppercase">
                Tutor verification
              </p>
              <h2 className="mt-4 max-w-2xl font-editorial text-4xl tracking-tight sm:text-5xl">
                Software finds the pattern. A tutor keeps the correction honest.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-ink-muted">
                TraceTutor is designed so tutors can review mistake labels,
                evidence traces, and intervention signals. “Tutor-verified”
                describes this review workflow; it does not mean ETS
                verification.
              </p>
            </Card>
            <Card className="p-7 sm:p-10">
              <p className="text-xs font-bold tracking-[0.16em] text-coral-deep uppercase">
                Independent status
              </p>
              <h2 className="mt-4 font-editorial text-3xl tracking-tight">
                Practice feedback, not an official score.
              </h2>
              <p className="mt-5 text-sm leading-6 text-ink-muted">
                TraceTutor is independent practice software and is not endorsed
                by or affiliated with ETS. TOEFL is a registered trademark of
                ETS. Any progress signal shown in the demo is learning
                feedback—not an official TOEFL score or score prediction.
              </p>
            </Card>
          </div>
        </section>

        <section className="px-4 pb-5 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-violet px-6 py-18 text-center text-white shadow-[0_30px_90px_rgba(76,49,143,0.28)] sm:px-12 sm:py-24">
            <div
              className="absolute -top-12 -left-12 size-48 rounded-full border-[32px] border-white/8"
              aria-hidden="true"
            />
            <div
              className="absolute -right-8 -bottom-16 size-56 rotate-12 rounded-[3rem] bg-coral/25"
              aria-hidden="true"
            />
            <p className="relative text-xs font-bold tracking-[0.18em] text-coral-soft uppercase">
              Your next ten minutes
            </p>
            <h2 className="relative mx-auto mt-4 max-w-4xl font-editorial text-4xl leading-[1.02] tracking-[-0.04em] text-balance sm:text-6xl">
              Stop collecting mistakes. Start correcting the one that repeats.
            </h2>
            <div className="relative mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/student/today" size="lg">
                Try the student demo <span aria-hidden="true">→</span>
              </Button>
              <Button href="/tutor/dashboard" variant="secondary" size="lg">
                See the tutor view
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-20 border-t border-ink/10 bg-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <BrandMark />
            <p className="mt-4 max-w-lg text-xs leading-5 text-ink-muted">
              TraceTutor is independent practice software, not endorsed by or
              affiliated with ETS. Practice feedback is not an official TOEFL
              score.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-ink-muted">
            <Link className="hover:text-ink" href="/demo">
              Demo
            </Link>
            <a className="hover:text-ink" href="#method">
              Method
            </a>
            <span>© 2026 TraceTutor</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

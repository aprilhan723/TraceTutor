"use client";

import { cloneElement, useMemo, useState, type ReactElement } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useTutorDemo } from "@/components/tutor/tutor-demo-provider";
import {
  distractorRelationLabels,
  distractorRelationTaxonomy,
  skillTaxonomy,
  type DistractorRelation,
} from "@/domain/mistake-intelligence";
import type { ContentEditorDraft, ContentStatus } from "@/domain/tutor";

const blankDraft: ContentEditorDraft = {
  contentKey: "tutor-original-01",
  taskType: "daily-life",
  skill: "detail",
  title: "",
  stimulusTitle: "",
  stimulusText: "",
  prompt: "",
  options: ["a", "b", "c", "d"].map((id) => ({
    id,
    label: "",
    distractorRelation: null,
  })),
  correctOptionId: "a",
  designatedEvidence: "",
  status: "draft",
};

export function ContentLibrary() {
  const { hydrated, bundle, saveContent } = useTutorDemo();
  const [taskFilter, setTaskFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [draft, setDraft] = useState<ContentEditorDraft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState("");

  const entries = useMemo(() => {
    if (!bundle) return [];
    return bundle.contentLibrary.filter(
      (entry) =>
        (taskFilter === "all" || entry.taskType === taskFilter) &&
        (skillFilter === "all" || entry.skill === skillFilter),
    );
  }, [bundle, skillFilter, taskFilter]);

  if (!hydrated || !bundle)
    return (
      <div
        className="h-96 animate-pulse rounded-[2rem] bg-white motion-reduce:animate-none"
        aria-label="Loading content library"
      />
    );
  const editorDrafts = bundle.contentEditorDrafts;

  function edit(contentKey: string) {
    const existing = editorDrafts.find(
      (candidate) => candidate.contentKey === contentKey,
    );
    if (!existing) return;
    setDraft(structuredClone(existing));
    setErrors({});
    setSaved("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitDraft() {
    if (!draft) return;
    const nextErrors = await saveContent(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setSaved(
        draft.status === "published"
          ? "Saved as a new immutable version."
          : "Draft saved locally.",
      );
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Original correction library"
        title="Content"
        description="Inspect evidence, skills, and option traps; then author safely without changing the item snapshot behind a past attempt."
        action={
          <Button
            onClick={() => {
              setDraft(structuredClone(blankDraft));
              setErrors({});
              setSaved("");
            }}
            variant="violet"
          >
            Create original item
          </Button>
        }
      />

      {draft ? (
        <Card className="mt-7 border-violet/25" aria-label="Content editor">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submitDraft();
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-violet uppercase">
                  Safe reading-item editor
                </p>
                <h2 className="mt-1 font-editorial text-3xl font-bold">
                  {draft.title || "New original item"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  Published edits create a new version. Past attempts keep their
                  original snapshot.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
                Close editor
              </Button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <EditorField label="Content key" error={errors.contentKey}>
                <input
                  value={draft.contentKey}
                  onChange={(event) =>
                    setDraft({ ...draft, contentKey: event.target.value })
                  }
                />
              </EditorField>
              <EditorField label="Title" error={errors.title}>
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft({ ...draft, title: event.target.value })
                  }
                />
              </EditorField>
              <EditorField label="Task type">
                <select
                  value={draft.taskType}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      taskType: event.target
                        .value as ContentEditorDraft["taskType"],
                    })
                  }
                >
                  <option value="daily-life">Read in Daily Life</option>
                  <option value="academic-passage">Academic Passage</option>
                </select>
              </EditorField>
              <EditorField label="Skill">
                <select
                  value={draft.skill}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      skill: event.target.value as ContentEditorDraft["skill"],
                    })
                  }
                >
                  {skillTaxonomy.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill.replaceAll("-", " ")}
                    </option>
                  ))}
                </select>
              </EditorField>
              <EditorField label="Stimulus title" error={errors.stimulusTitle}>
                <input
                  value={draft.stimulusTitle}
                  onChange={(event) =>
                    setDraft({ ...draft, stimulusTitle: event.target.value })
                  }
                />
              </EditorField>
              <EditorField label="Content status">
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      status: event.target.value as ContentStatus,
                    })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="published">Published</option>
                  <option value="retired">Retired</option>
                </select>
              </EditorField>
            </div>
            <div className="mt-4 grid gap-4">
              <EditorField
                label="Original stimulus text"
                error={errors.stimulusText}
              >
                <textarea
                  rows={5}
                  value={draft.stimulusText}
                  onChange={(event) =>
                    setDraft({ ...draft, stimulusText: event.target.value })
                  }
                />
              </EditorField>
              <EditorField label="Question prompt" error={errors.prompt}>
                <textarea
                  rows={2}
                  value={draft.prompt}
                  onChange={(event) =>
                    setDraft({ ...draft, prompt: event.target.value })
                  }
                />
              </EditorField>
              <EditorField
                label="Designated evidence span"
                error={errors.designatedEvidence}
              >
                <textarea
                  rows={2}
                  value={draft.designatedEvidence}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      designatedEvidence: event.target.value,
                    })
                  }
                />
              </EditorField>
            </div>

            <fieldset className="mt-6">
              <legend className="font-editorial text-2xl font-bold">
                Four complete options
              </legend>
              <p className="mt-1 text-sm text-ink-muted">
                Choose exactly one correct option and tag every distractor.
              </p>
              {errors.options ||
              errors.correctOptionId ||
              errors.distractorTags ? (
                <p
                  role="alert"
                  className="mt-2 text-sm font-bold text-coral-deep"
                >
                  {errors.options ??
                    errors.correctOptionId ??
                    errors.distractorTags}
                </p>
              ) : null}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {draft.options.map((option, index) => {
                  const correct = option.id === draft.correctOptionId;
                  return (
                    <div
                      key={option.id}
                      className={`rounded-2xl border p-4 ${correct ? "border-mint-deep/25 bg-mint" : "border-ink/10 bg-cream/50"}`}
                    >
                      <label className="flex items-center gap-2 text-xs font-bold uppercase">
                        <input
                          type="radio"
                          name="correct-option"
                          checked={correct}
                          onChange={() =>
                            setDraft({
                              ...draft,
                              correctOptionId: option.id,
                              options: draft.options.map((candidate) => ({
                                ...candidate,
                                distractorRelation:
                                  candidate.id === option.id
                                    ? null
                                    : candidate.distractorRelation,
                              })),
                            })
                          }
                        />{" "}
                        Option {index + 1} ·{" "}
                        {correct ? "Correct" : "Mark correct"}
                      </label>
                      <label className="mt-3 block text-xs font-bold uppercase">
                        Answer text
                        <input
                          value={option.label}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              options: draft.options.map((candidate) =>
                                candidate.id === option.id
                                  ? { ...candidate, label: event.target.value }
                                  : candidate,
                              ),
                            })
                          }
                          className="mt-1"
                        />
                      </label>
                      <label className="mt-3 block text-xs font-bold uppercase">
                        Distractor tag
                        <select
                          aria-label={`Distractor tag for option ${option.id.toUpperCase()}`}
                          disabled={correct}
                          value={option.distractorRelation ?? ""}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              options: draft.options.map((candidate) =>
                                candidate.id === option.id
                                  ? {
                                      ...candidate,
                                      distractorRelation: (event.target.value ||
                                        null) as DistractorRelation | null,
                                    }
                                  : candidate,
                              ),
                            })
                          }
                          className="mt-1"
                        >
                          <option value="">
                            {correct ? "Correct answer — no tag" : "Select tag"}
                          </option>
                          {distractorRelationTaxonomy.map((relation) => (
                            <option key={relation} value={relation}>
                              {distractorRelationLabels[relation]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button type="submit" variant="violet">
                Validate and save
              </Button>
              {saved ? (
                <p role="status" className="text-sm font-bold text-mint-deep">
                  {saved}
                </p>
              ) : null}
            </div>
          </form>
        </Card>
      ) : null}

      <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-4 sm:flex-row">
        <label className="flex-1 text-xs font-bold uppercase">
          Task type
          <select
            value={taskFilter}
            onChange={(event) => setTaskFilter(event.target.value)}
            className="mt-2"
          >
            <option value="all">All task types</option>
            <option value="complete-the-words">Complete the Words</option>
            <option value="daily-life">Read in Daily Life</option>
            <option value="academic-passage">Academic Passage</option>
          </select>
        </label>
        <label className="flex-1 text-xs font-bold uppercase">
          Skill
          <select
            value={skillFilter}
            onChange={(event) => setSkillFilter(event.target.value)}
            className="mt-2"
          >
            <option value="all">All skills</option>
            {skillTaxonomy.map((skill) => (
              <option key={skill} value={skill}>
                {skill.replaceAll("-", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-4 text-sm font-semibold text-ink-muted">
        {entries.length} items · Original practice content — independent and not
        official ETS material.
      </p>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {entries.map((entry) => (
          <Card
            key={`${entry.contentKey}-${entry.version}`}
            className="overflow-hidden p-0"
          >
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-wide text-violet uppercase">
                    {entry.taskType.replaceAll("-", " ")} ·{" "}
                    {entry.skill.replaceAll("-", " ")}
                  </p>
                  <h2 className="mt-2 font-editorial text-2xl font-bold">
                    {entry.title}
                  </h2>
                </div>
                <div className="flex gap-2">
                  <Badge
                    tone={
                      entry.status === "published"
                        ? "mint"
                        : entry.status === "retired"
                          ? "neutral"
                          : "violet"
                    }
                  >
                    {entry.status}
                  </Badge>
                  <Badge tone="neutral">v{entry.version}</Badge>
                </div>
              </div>
              <details className="mt-5 rounded-xl border border-ink/10 bg-cream/40 p-4">
                <summary className="cursor-pointer text-sm font-bold">
                  Inspect evidence and option labels
                </summary>
                <div className="mt-4">
                  <p className="text-xs font-bold text-mint-deep uppercase">
                    Designated evidence
                  </p>
                  {entry.evidence.map((evidence) => (
                    <p
                      key={evidence}
                      className="mt-2 rounded-lg bg-mint p-3 text-sm leading-6"
                    >
                      {evidence}
                    </p>
                  ))}
                  {entry.options.length ? (
                    <div className="mt-4 space-y-2">
                      {entry.options.map((option) => (
                        <div
                          key={option.id}
                          className="flex flex-col gap-1 rounded-lg border border-ink/10 bg-white p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span>
                            <strong>{option.id.toUpperCase()}.</strong>{" "}
                            {option.label}
                          </span>
                          <Badge tone={option.correct ? "mint" : "coral"}>
                            {option.distractorLabel}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-ink-muted">
                      Typed response item; no option set.
                    </p>
                  )}
                </div>
              </details>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-ink/10 bg-violet-soft px-5 py-3">
              <p className="text-xs text-ink-muted">
                {entry.versionId
                  ? "Tutor-authored version"
                  : "Reviewed built-in snapshot"}
              </p>
              {editorDrafts.some(
                (candidate) => candidate.contentKey === entry.contentKey,
              ) ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => edit(entry.contentKey)}
                >
                  Edit safely
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EditorField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactElement<{ className?: string }>;
}) {
  return (
    <label className="block text-xs font-bold uppercase">
      {label}
      {cloneElement(children, {
        className: `mt-2 min-h-12 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm font-normal normal-case ${children.props.className ?? ""}`,
      })}
      {error ? (
        <span className="mt-1 block text-xs font-bold text-coral-deep normal-case">
          {error}
        </span>
      ) : null}
    </label>
  );
}

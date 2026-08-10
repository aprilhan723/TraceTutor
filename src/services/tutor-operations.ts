import { getItemDiagnosticMetadata } from "@/data/diagnostic-metadata";
import {
  getPracticeItem,
  getReadingStimulus,
  practiceItems,
} from "@/data/practice-content";
import type { Student } from "@/domain/models";
import {
  distractorRelationLabels,
  errorCauseLabels,
  type ErrorCause,
} from "@/domain/mistake-intelligence";
import type { StudentStudyState } from "@/domain/study";
import type {
  ContentEditorDraft,
  TutorAdjudication,
  TutorAdjudicationCommand,
  TutorContentVersion,
  TutorDiagnosisCase,
  TutorWorkspaceState,
} from "@/domain/tutor";
import { differenceInDays } from "@/lib/clock";

export interface TutorQueueItem {
  caseId: string;
  diagnosisId: string;
  studentId: string;
  patternLabel: string;
  priorityScore: number;
  priority: "high" | "medium" | "low";
  reasons: string[];
  createdAt: string;
}

export interface TutorDashboardMetrics {
  unresolvedDiagnoses: number;
  highConfidenceWrong: number;
  dueOrFailedReviews: number;
  recentCorrectedErrors: number;
  medianReviewMinutes: number | null;
}

export interface ContentLibraryEntry {
  contentKey: string;
  version: number;
  versionId: string | null;
  title: string;
  taskType: string;
  skill: string;
  status: "draft" | "reviewed" | "published" | "retired";
  evidence: string[];
  options: Array<{
    id: string;
    label: string;
    distractorLabel: string;
    correct: boolean;
  }>;
}

export interface TutorDiagnosisDetail {
  case: TutorDiagnosisCase;
  itemTitle: string;
  prompt: string;
  stimulusTitle: string | null;
  stimulusSegments: Array<{
    id: string;
    text: string;
    selected: boolean;
    designated: boolean;
  }>;
  options: Array<{
    id: string;
    label: string;
    selected: boolean;
    correct: boolean;
  }>;
  transferChoices: Array<{ id: string; label: string }>;
}

export interface LessonBrief {
  studentId: string;
  generatedAt: string;
  priorities: Array<{
    cause: ErrorCause;
    label: string;
    evidence: string[];
    intervention: string;
  }>;
  itemLinks: Array<{ label: string; href: string; prompt: string }>;
  masteredTopicsToSkip: string[];
  unresolvedQuestions: string[];
  tutorNotes: string;
}

export interface WeeklyReport {
  periodLabel: string;
  missionsCompleted: number;
  verifiedCorrections: number;
  improving: string[];
  recurring: string[];
  waitingForReview: string[];
  confidenceCalibrationChange: number;
  nextWeekFocus: string[];
  latestFeedback: string[];
}

function currentCause(item: TutorDiagnosisCase) {
  return item.adjudication.primaryCause ?? item.machineSuggestion.primaryCause;
}

export function buildTutorQueue(
  workspace: TutorWorkspaceState,
  todayKey: string,
): TutorQueueItem[] {
  const profileByStudent = new Map(
    workspace.studentProfiles.map((profile) => [profile.studentId, profile]),
  );

  return workspace.diagnosisCases
    .filter((item) =>
      ["pending", "in-review", "ambiguous"].includes(item.adjudication.status),
    )
    .map((item) => {
      const reasons: string[] = [];
      let priorityScore = 0;
      const highConfidenceWrong =
        item.attempt.confidence === "certain" &&
        item.attempt.selectedOptionId !== item.attempt.correctOptionId;
      if (highConfidenceWrong) {
        priorityScore += 26;
        reasons.push("The wrong answer was submitted with certain confidence.");
      }

      const recurrencePoints = Math.min(24, item.recurrenceCount * 5);
      priorityScore += recurrencePoints;
      if (item.recurrenceCount > 1) {
        reasons.push(
          `This pattern has recurred ${item.recurrenceCount} times.`,
        );
      }

      const d7Failed = item.retentionHistory.some(
        (review) => review.cadence === "D7" && review.outcome === "needs-work",
      );
      if (d7Failed) {
        priorityScore += 24;
        reasons.push("A distinct Day 7 return still needs work.");
      }

      if (item.machineSuggestion.confidence < 0.72) {
        priorityScore += 12;
        reasons.push(
          "The rule evidence leaves meaningful diagnostic ambiguity.",
        );
      } else if (item.machineSuggestion.secondaryCauses.length > 0) {
        priorityScore += 6;
        reasons.push(
          "The rule trace has a plausible alternate cause to review.",
        );
      }

      const profile = profileByStudent.get(item.studentId);
      if (profile) {
        const daysToTest = differenceInDays(profile.targetTestDate, todayKey);
        if (daysToTest <= 14) {
          priorityScore += 20;
          reasons.push(`The target test is ${daysToTest} days away.`);
        } else if (daysToTest <= 45) {
          priorityScore += 10;
          reasons.push(`The target test is ${daysToTest} days away.`);
        }
      }

      if (item.studentQuestion && !item.questionResolved) {
        priorityScore += 15;
        reasons.push("The student left an unresolved question.");
      }

      if (item.adjudication.ambiguous) {
        priorityScore += 10;
        reasons.push("The tutor marked the item as ambiguous.");
      }

      return {
        caseId: item.id,
        diagnosisId: item.diagnosisId,
        studentId: item.studentId,
        patternLabel: item.patternLabel,
        priorityScore,
        priority:
          priorityScore >= 70
            ? ("high" as const)
            : priorityScore >= 45
              ? ("medium" as const)
              : ("low" as const),
        reasons,
        createdAt: item.createdAt,
      };
    })
    .sort(
      (left, right) =>
        right.priorityScore - left.priorityScore ||
        right.createdAt.localeCompare(left.createdAt),
    );
}

export function calculateTutorDashboardMetrics(
  workspace: TutorWorkspaceState,
  todayKey: string,
): TutorDashboardMetrics {
  const unresolved = workspace.diagnosisCases.filter((item) =>
    ["pending", "in-review", "ambiguous"].includes(item.adjudication.status),
  );
  const reviewDurations = workspace.diagnosisCases
    .map((item) => item.adjudication.reviewDurationSeconds)
    .filter((duration): duration is number => duration !== null)
    .sort((left, right) => left - right);
  const middle = Math.floor(reviewDurations.length / 2);
  const medianSeconds = reviewDurations.length
    ? reviewDurations.length % 2
      ? reviewDurations[middle]
      : ((reviewDurations[middle - 1] ?? 0) + (reviewDurations[middle] ?? 0)) /
        2
    : null;

  return {
    unresolvedDiagnoses: unresolved.length,
    highConfidenceWrong: unresolved.filter(
      (item) =>
        item.attempt.confidence === "certain" &&
        item.attempt.selectedOptionId !== item.attempt.correctOptionId,
    ).length,
    dueOrFailedReviews: workspace.diagnosisCases
      .flatMap((item) => item.retentionHistory)
      .filter(
        (review) =>
          (review.cadence === "D2" || review.cadence === "D7") &&
          (review.outcome === "needs-work" ||
            (review.outcome === "scheduled" &&
              review.dueDate.localeCompare(todayKey) <= 0)),
      ).length,
    recentCorrectedErrors: workspace.diagnosisCases.filter(
      (item) =>
        ["approved", "changed"].includes(item.adjudication.status) &&
        Boolean(item.adjudication.reviewedAt),
    ).length,
    medianReviewMinutes:
      medianSeconds === null ? null : Number((medianSeconds / 60).toFixed(1)),
  };
}

function defaultAdjudication(item: TutorDiagnosisCase): TutorAdjudication {
  return {
    ...item.adjudication,
    primaryCause:
      item.adjudication.primaryCause ?? item.machineSuggestion.primaryCause,
    secondaryCauses:
      item.adjudication.secondaryCauses.length > 0
        ? item.adjudication.secondaryCauses
        : item.machineSuggestion.secondaryCauses,
  };
}

export function applyTutorAdjudication(
  workspace: TutorWorkspaceState,
  caseId: string,
  command: TutorAdjudicationCommand,
  tutorId: string,
  nowIso: string,
): TutorWorkspaceState {
  let changed = false;
  const diagnosisCases = workspace.diagnosisCases.map((item) => {
    if (item.id !== caseId) return item;
    changed = true;
    const adjudication = defaultAdjudication(item);
    let action: TutorAuditEventAction = "approved";
    let summary = "Approved the rule-first suggestion.";

    if (command.type === "approve") {
      adjudication.status =
        adjudication.primaryCause === item.machineSuggestion.primaryCause
          ? "approved"
          : "changed";
      adjudication.reviewedByTutorId = tutorId;
      adjudication.reviewedAt = nowIso;
      adjudication.reviewDurationSeconds =
        command.reviewDurationSeconds ??
        adjudication.reviewDurationSeconds ??
        120;
      action = "approved";
      summary = `Approved ${adjudication.primaryCause ? errorCauseLabels[adjudication.primaryCause] : "the no-cause decision"}.`;
    } else if (command.type === "change-primary") {
      const previous = adjudication.primaryCause;
      adjudication.primaryCause = command.cause;
      adjudication.status = "in-review";
      action = "primary-changed";
      summary = `Changed the primary cause from ${previous ? errorCauseLabels[previous] : "No cause"} to ${errorCauseLabels[command.cause]}.`;
    } else if (command.type === "add-secondary") {
      adjudication.secondaryCauses = [
        ...new Set([...adjudication.secondaryCauses, command.cause]),
      ].filter((cause) => cause !== adjudication.primaryCause);
      adjudication.status = "in-review";
      action = "secondary-added";
      summary = `Added ${errorCauseLabels[command.cause]} as an alternate cause.`;
    } else if (command.type === "remove-secondary") {
      adjudication.secondaryCauses = adjudication.secondaryCauses.filter(
        (cause) => cause !== command.cause,
      );
      adjudication.status = "in-review";
      action = "secondary-removed";
      summary = `Removed ${errorCauseLabels[command.cause]} from the alternate causes.`;
    } else if (command.type === "assign-transfer") {
      adjudication.assignedTransferItemId = command.itemId;
      action = "transfer-assigned";
      summary = `Assigned ${command.itemId} as the next transfer item.`;
    } else if (command.type === "request-follow-up") {
      adjudication.followUpQuestion = command.question.trim();
      action = "follow-up-requested";
      summary = "Requested one student follow-up question.";
    } else if (command.type === "mark-ambiguous") {
      adjudication.ambiguous = true;
      adjudication.status = "ambiguous";
      action = "ambiguity-marked";
      summary = "Marked the item as ambiguous for content review.";
    } else if (command.type === "add-to-lesson-brief") {
      adjudication.addedToLessonBrief = true;
      action = "lesson-brief-added";
      summary = "Added the diagnosis to the next lesson brief.";
    } else {
      adjudication.feedback = command.feedback.trim();
      action = "feedback-sent";
      summary = "Saved concise student-facing feedback.";
    }

    return {
      ...item,
      adjudication,
      auditTrail: [
        ...item.auditTrail,
        {
          id: `audit-${item.id}-${item.auditTrail.length + 1}`,
          action,
          summary,
          createdAt: nowIso,
          tutorId,
        },
      ],
    };
  });

  return changed
    ? { ...workspace, diagnosisCases, updatedAt: nowIso }
    : workspace;
}

type TutorAuditEventAction = TutorDiagnosisCase["auditTrail"][number]["action"];

export function validateContentDraft(draft: ContentEditorDraft) {
  const errors: Record<string, string> = {};
  if (!draft.contentKey.trim()) errors.contentKey = "Add a stable content key.";
  if (!draft.title.trim()) errors.title = "Add an item title.";
  if (!draft.stimulusTitle.trim()) {
    errors.stimulusTitle = "Add a stimulus title.";
  }
  if (!draft.stimulusText.trim()) errors.stimulusText = "Add source text.";
  if (!draft.prompt.trim()) errors.prompt = "Add a question prompt.";
  if (!draft.designatedEvidence.trim()) {
    errors.designatedEvidence = "Designate the evidence span.";
  } else if (
    !draft.stimulusText
      .toLocaleLowerCase()
      .includes(draft.designatedEvidence.trim().toLocaleLowerCase())
  ) {
    errors.designatedEvidence =
      "The designated evidence must appear in the source text.";
  }

  if (draft.options.length !== 4) {
    errors.options = "Provide exactly four options.";
  } else if (draft.options.some((option) => !option.label.trim())) {
    errors.options = "Complete every option.";
  }
  const correctOptions = draft.options.filter(
    (option) => option.id === draft.correctOptionId,
  );
  if (correctOptions.length !== 1) {
    errors.correctOptionId = "Select exactly one correct answer.";
  }
  if (
    draft.options.some(
      (option) =>
        option.id !== draft.correctOptionId && !option.distractorRelation,
    )
  ) {
    errors.distractorTags = "Tag every incorrect option’s distractor relation.";
  }
  if (
    draft.options.some(
      (option) =>
        option.id === draft.correctOptionId && option.distractorRelation,
    )
  ) {
    errors.distractorTags = "The correct option cannot carry a distractor tag.";
  }
  return errors;
}

export function saveContentVersion(
  versions: TutorContentVersion[],
  draft: ContentEditorDraft,
  tutorId: string,
  nowIso: string,
) {
  const errors = validateContentDraft(draft);
  if (Object.keys(errors).length > 0) return { versions, errors };
  const current = versions
    .filter((version) => version.contentKey === draft.contentKey)
    .sort((left, right) => right.version - left.version)[0];
  const mustFork = current?.status === "published";
  const versionNumber = mustFork
    ? current.version + 1
    : (current?.version ?? 1);
  const next: TutorContentVersion = {
    ...draft,
    id: `${draft.contentKey}-v${versionNumber}`,
    version: versionNumber,
    parentVersionId: mustFork ? current.id : (current?.parentVersionId ?? null),
    createdAt: nowIso,
    createdByTutorId: tutorId,
  };
  return {
    errors,
    versions:
      current && !mustFork
        ? versions.map((version) =>
            version.id === current.id ? next : version,
          )
        : [...versions, next],
  };
}

export function buildContentLibrary(
  workspace: TutorWorkspaceState,
): ContentLibraryEntry[] {
  const latestVersions = new Map<string, TutorContentVersion>();
  for (const version of workspace.contentVersions) {
    const current = latestVersions.get(version.contentKey);
    if (!current || version.version > current.version) {
      latestVersions.set(version.contentKey, version);
    }
  }

  const baseEntries = practiceItems.map((item): ContentLibraryEntry => {
    const metadata = getItemDiagnosticMetadata(item);
    const stimulus =
      item.kind === "reading-question"
        ? getReadingStimulus(item.stimulusId)
        : null;
    const evidence =
      item.kind === "reading-question"
        ? item.correctEvidenceSegmentIds.map(
            (segmentId) =>
              stimulus?.segments.find((segment) => segment.id === segmentId)
                ?.text ?? segmentId,
          )
        : item.kind === "complete-words"
          ? [`${item.wordPrefix}${item.answerEnding}`]
          : [item.microContext];
    const options =
      item.kind === "complete-words"
        ? []
        : item.options.map((option) => {
            const correct = option.id === item.correctOptionId;
            const relation = metadata.optionDistractorTags[option.id];
            return {
              id: option.id,
              label: option.label,
              correct,
              distractorLabel: correct
                ? "Correct answer"
                : relation
                  ? distractorRelationLabels[relation]
                  : "Needs tag",
            };
          });
    return {
      contentKey: item.id,
      version: 1,
      versionId: null,
      title: item.title,
      taskType: item.taskType,
      skill: metadata.skill,
      status: "published",
      evidence,
      options,
    };
  });

  const customEntries = [...latestVersions.values()].map(
    (version): ContentLibraryEntry => ({
      contentKey: version.contentKey,
      version: version.version,
      versionId: version.id,
      title: version.title,
      taskType: version.taskType,
      skill: version.skill,
      status: version.status,
      evidence: [version.designatedEvidence],
      options: version.options.map((option) => ({
        id: option.id,
        label: option.label,
        correct: option.id === version.correctOptionId,
        distractorLabel:
          option.id === version.correctOptionId
            ? "Correct answer"
            : option.distractorRelation
              ? distractorRelationLabels[option.distractorRelation]
              : "Needs tag",
      })),
    }),
  );

  const customKeys = new Set(customEntries.map((entry) => entry.contentKey));
  return [
    ...customEntries,
    ...baseEntries.filter((entry) => !customKeys.has(entry.contentKey)),
  ].sort((left, right) => left.title.localeCompare(right.title));
}

export function buildContentEditorDrafts(
  workspace: TutorWorkspaceState,
): ContentEditorDraft[] {
  const latestVersions = new Map<string, TutorContentVersion>();
  for (const version of workspace.contentVersions) {
    const current = latestVersions.get(version.contentKey);
    if (!current || version.version > current.version) {
      latestVersions.set(version.contentKey, version);
    }
  }
  const builtIn = practiceItems.flatMap((item): ContentEditorDraft[] => {
    if (item.kind !== "reading-question") return [];
    const stimulus = getReadingStimulus(item.stimulusId);
    const metadata = getItemDiagnosticMetadata(item);
    return [
      {
        contentKey: item.id,
        taskType: item.taskType,
        skill: metadata.skill,
        title: item.title,
        stimulusTitle: stimulus?.title ?? item.title,
        stimulusText:
          stimulus?.segments.map((segment) => segment.text).join(" ") ?? "",
        prompt: item.prompt,
        options: item.options.map((option) => ({
          id: option.id,
          label: option.label,
          distractorRelation:
            option.id === item.correctOptionId
              ? null
              : (metadata.optionDistractorTags[option.id] ?? null),
        })),
        correctOptionId: item.correctOptionId,
        designatedEvidence: item.correctEvidenceSegmentIds
          .map(
            (segmentId) =>
              stimulus?.segments.find((segment) => segment.id === segmentId)
                ?.text ?? "",
          )
          .filter(Boolean)
          .join(" "),
        status: "published",
      },
    ];
  });
  const customKeys = new Set(latestVersions.keys());
  return [
    ...[...latestVersions.values()].map(
      ({
        contentKey,
        taskType,
        skill,
        title,
        stimulusTitle,
        stimulusText,
        prompt,
        options,
        correctOptionId,
        designatedEvidence,
        status,
      }) => ({
        contentKey,
        taskType,
        skill,
        title,
        stimulusTitle,
        stimulusText,
        prompt,
        options,
        correctOptionId,
        designatedEvidence,
        status,
      }),
    ),
    ...builtIn.filter((draft) => !customKeys.has(draft.contentKey)),
  ];
}

export function buildTutorDiagnosisDetail(
  item: TutorDiagnosisCase,
): TutorDiagnosisDetail {
  const practiceItem = getPracticeItem(item.attempt.itemId);
  const stimulus =
    practiceItem?.kind === "reading-question"
      ? getReadingStimulus(practiceItem.stimulusId)
      : null;
  const prompt =
    practiceItem?.kind === "complete-words"
      ? `${practiceItem.paragraphBefore}${practiceItem.wordPrefix}___${practiceItem.paragraphAfter}`
      : (practiceItem?.prompt ?? item.patternLabel);
  const options =
    practiceItem && practiceItem.kind !== "complete-words"
      ? practiceItem.options.map((option) => ({
          id: option.id,
          label: option.label,
          selected: option.id === item.attempt.selectedOptionId,
          correct: option.id === item.attempt.correctOptionId,
        }))
      : [
          {
            id: "typed-response",
            label: item.attempt.selectedOptionId,
            selected: true,
            correct:
              item.attempt.selectedOptionId === item.attempt.correctOptionId,
          },
          {
            id: "correct-form",
            label: item.attempt.correctOptionId,
            selected: false,
            correct: true,
          },
        ];

  return {
    case: item,
    itemTitle: practiceItem?.title ?? item.patternLabel,
    prompt,
    stimulusTitle: stimulus?.title ?? null,
    stimulusSegments:
      stimulus?.segments.map((segment) => ({
        id: segment.id,
        text: segment.text,
        selected: item.attempt.selectedEvidenceSegmentIds.includes(segment.id),
        designated: item.attempt.designatedEvidenceSegmentIds.includes(
          segment.id,
        ),
      })) ?? [],
    options,
    transferChoices: practiceItems
      .filter((candidate) => candidate.kind === "transfer")
      .map((candidate) => ({ id: candidate.id, label: candidate.title })),
  };
}

function interventionFor(cause: ErrorCause, minutes: number) {
  if (
    cause === "scope-expanded" ||
    cause === "modality-strengthened" ||
    cause === "modality-weakened"
  ) {
    return `${minutes} minutes: underline limiting words, restate the smallest safe claim, then compare two fresh option pairs.`;
  }
  if (
    cause === "actor-mismatch" ||
    cause === "time-mismatch" ||
    cause === "condition-mismatch"
  ) {
    return `${minutes} minutes: build a who–does–what–when trace, then run two distinct transfer checks.`;
  }
  if (cause === "grammar-morphology-failure") {
    return `${minutes} minutes: name the required part of speech before completing three new word endings.`;
  }
  return `${minutes} minutes: locate the decisive evidence, explain the option relationship, and finish with a new-surface transfer.`;
}

export function buildLessonBrief(
  workspace: TutorWorkspaceState,
  studentId: string,
  generatedAt: string,
): LessonBrief {
  const cases = workspace.diagnosisCases.filter(
    (item) => item.studentId === studentId,
  );
  const selected = cases
    .filter(
      (item) =>
        item.adjudication.addedToLessonBrief ||
        ["approved", "changed"].includes(item.adjudication.status),
    )
    .sort(
      (left, right) =>
        Number(right.adjudication.addedToLessonBrief) -
          Number(left.adjudication.addedToLessonBrief) ||
        right.recurrenceCount - left.recurrenceCount,
    );
  const priorityMap = new Map<ErrorCause, TutorDiagnosisCase[]>();
  for (const item of selected) {
    const cause = currentCause(item);
    if (!cause || (priorityMap.size >= 3 && !priorityMap.has(cause))) continue;
    priorityMap.set(cause, [...(priorityMap.get(cause) ?? []), item]);
  }
  const minutesPerPriority =
    priorityMap.size === 1 ? 12 : priorityMap.size === 2 ? 6 : 4;
  const priorities = [...priorityMap.entries()].map(([cause, items]) => ({
    cause,
    label: errorCauseLabels[cause],
    evidence: items
      .flatMap((item) => item.machineSuggestion.supportingEvidence)
      .slice(0, 2),
    intervention: interventionFor(cause, minutesPerPriority),
  }));
  const linkedCases = selected.slice(0, 2);

  return {
    studentId,
    generatedAt,
    priorities,
    itemLinks: linkedCases.map((item) => ({
      label: getPracticeItem(item.attempt.itemId)?.title ?? item.patternLabel,
      href: `/tutor/review/${item.id}`,
      prompt:
        getPracticeItem(item.attempt.itemId)?.kind === "reading-question"
          ? (getPracticeItem(item.attempt.itemId) as { prompt: string }).prompt
          : item.patternLabel,
    })),
    masteredTopicsToSkip: cases
      .filter((item) =>
        item.retentionHistory.some(
          (review) => review.cadence === "D7" && review.outcome === "secure",
        ),
      )
      .map((item) => item.patternLabel)
      .slice(0, 3),
    unresolvedQuestions: cases
      .filter((item) => item.studentQuestion && !item.questionResolved)
      .map((item) => item.studentQuestion ?? ""),
    tutorNotes:
      workspace.lessonBriefs.find((brief) => brief.studentId === studentId)
        ?.tutorNotes ?? "",
  };
}

export function calculateWeeklyReport(
  workspace: TutorWorkspaceState,
  studentId: string,
): WeeklyReport {
  const profile = workspace.studentProfiles.find(
    (candidate) => candidate.studentId === studentId,
  );
  const recentDays = profile?.adherence.slice(-7) ?? [];
  const cases = workspace.diagnosisCases.filter(
    (item) => item.studentId === studentId,
  );
  const verified = cases.filter((item) =>
    ["approved", "changed"].includes(item.adjudication.status),
  );
  const improving = verified
    .filter((item) =>
      item.retentionHistory.some((review) => review.outcome === "secure"),
    )
    .map((item) => errorCauseLabels[currentCause(item) ?? "evidence-misread"]);
  const recurring = cases
    .filter(
      (item) =>
        item.recurrenceCount >= 3 ||
        item.retentionHistory.some(
          (review) =>
            review.cadence === "D7" && review.outcome === "needs-work",
        ),
    )
    .map((item) => item.patternLabel);
  const waitingForReview = cases
    .filter((item) =>
      ["pending", "in-review", "ambiguous"].includes(item.adjudication.status),
    )
    .map((item) => item.patternLabel);
  const focus = buildLessonBrief(
    workspace,
    studentId,
    workspace.updatedAt,
  ).priorities.map((priority) => priority.label);

  return {
    periodLabel:
      recentDays.length > 0
        ? `${recentDays[0]?.dateKey} to ${recentDays.at(-1)?.dateKey}`
        : "No active week",
    missionsCompleted: recentDays.filter((day) => day.status !== "missed")
      .length,
    verifiedCorrections: verified.length,
    improving: [...new Set(improving)],
    recurring: [...new Set(recurring)],
    waitingForReview: [...new Set(waitingForReview)],
    confidenceCalibrationChange: profile
      ? profile.confidenceCalibration - profile.previousConfidenceCalibration
      : 0,
    nextWeekFocus: focus.slice(0, 3),
    latestFeedback: verified
      .map((item) => item.adjudication.feedback)
      .filter((feedback): feedback is string => Boolean(feedback))
      .slice(0, 2),
  };
}

export function getStudentById(students: Student[], studentId: string) {
  return students.find((student) => student.id === studentId) ?? null;
}

export function updateLessonNotes(
  workspace: TutorWorkspaceState,
  studentId: string,
  tutorNotes: string,
  nowIso: string,
) {
  const exists = workspace.lessonBriefs.some(
    (brief) => brief.studentId === studentId,
  );
  return {
    ...workspace,
    lessonBriefs: exists
      ? workspace.lessonBriefs.map((brief) =>
          brief.studentId === studentId
            ? { ...brief, tutorNotes, updatedAt: nowIso }
            : brief,
        )
      : [
          ...workspace.lessonBriefs,
          { studentId, tutorNotes, updatedAt: nowIso },
        ],
    updatedAt: nowIso,
  };
}

export function updateTutorStudentNotes(
  workspace: TutorWorkspaceState,
  studentId: string,
  tutorNotes: string,
  nowIso: string,
) {
  return {
    ...workspace,
    studentProfiles: workspace.studentProfiles.map((profile) =>
      profile.studentId === studentId ? { ...profile, tutorNotes } : profile,
    ),
    updatedAt: nowIso,
  };
}

export function calculateStudentTrend(
  profile: TutorWorkspaceState["studentProfiles"][number],
) {
  const completed = profile.adherence.filter(
    (day) => day.status !== "missed",
  ).length;
  const accuracies = profile.adherence
    .map((day) => day.accuracy)
    .filter((accuracy): accuracy is number => accuracy !== null);
  const split = Math.max(1, Math.floor(accuracies.length / 2));
  const average = (values: number[]) =>
    values.length
      ? Math.round(
          values.reduce((sum, value) => sum + value, 0) / values.length,
        )
      : 0;
  return {
    adherencePercentage: Math.round(
      (completed / Math.max(1, profile.adherence.length)) * 100,
    ),
    accuracyChange:
      average(accuracies.slice(split)) - average(accuracies.slice(0, split)),
  };
}

export function buildTutorDashboard(
  workspace: TutorWorkspaceState,
  studyState: StudentStudyState,
  todayKey: string,
) {
  return {
    queue: buildTutorQueue(workspace, todayKey),
    metrics: calculateTutorDashboardMetrics(workspace, todayKey),
    recentCorrected: workspace.diagnosisCases
      .filter((item) =>
        ["approved", "changed"].includes(item.adjudication.status),
      )
      .sort((left, right) =>
        (right.adjudication.reviewedAt ?? "").localeCompare(
          left.adjudication.reviewedAt ?? "",
        ),
      )
      .slice(0, 3),
    trend: workspace.studentProfiles[0]
      ? calculateStudentTrend(workspace.studentProfiles[0])
      : null,
    correctionStreak: studyState.correctionStreak,
  };
}

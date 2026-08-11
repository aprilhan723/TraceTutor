import { getItemDiagnosticMetadata } from "@/data/diagnostic-metadata";
import {
  completeWordsItems,
  practiceItems,
  transferItems,
} from "@/data/practice-content";
import type { MistakeCategory } from "@/domain/models";
import {
  distractorRelationLabels,
  errorCauseLabels,
  type DistractorRelation,
  type ErrorCause,
} from "@/domain/mistake-intelligence";
import type {
  MilestoneId,
  MissionItemRef,
  StreakReason,
  StudentStudyState,
  StudyMission,
} from "@/domain/study";
import type { Clock } from "@/lib/clock";
import { addDays, toDateKey } from "@/lib/clock";

const roadmapFocus = [
  [
    "Set the trace",
    "Meet the correction loop and establish an evidence baseline.",
  ],
  ["Return to proof", "Complete the first spaced return before new practice."],
  [
    "Keep the claim small",
    "Separate a safe inference from an attractive overreach.",
  ],
  [
    "Form under pressure",
    "Use grammar and context without rushing the word ending.",
  ],
  [
    "Calibrate certainty",
    "Match confidence to what the text actually supports.",
  ],
  [
    "Transfer the rule",
    "Use the same correction on a different topic and surface.",
  ],
  ["Weekly Boss", "Mix the week’s recurring traps in The Half-Truth Hydra."],
  [
    "Restart cleanly",
    "Begin week two with the most useful unresolved pattern.",
  ],
  [
    "Compare the options",
    "Name why a distractor is tempting before rejecting it.",
  ],
  [
    "Protect the actor",
    "Keep who, what, and when attached to the right sentence.",
  ],
  [
    "Build speed with proof",
    "Shorten the trace without dropping the evidence step.",
  ],
  [
    "Day 7 return",
    "Test whether an earlier correction still holds after time.",
  ],
  [
    "Close the open loops",
    "Revisit only patterns that still need distinct evidence.",
  ],
  [
    "Final mixed proof",
    "Finish with a second Half-Truth Hydra and a retention check.",
  ],
] as const;

export interface SprintRoadmapDay {
  dayNumber: number;
  title: string;
  detail: string;
  dateKey: string;
  status: "complete" | "current" | "upcoming";
  bossDay: boolean;
}

export interface MilestoneMoment {
  id: MilestoneId;
  title: string;
  detail: string;
  achieved: boolean;
}

export interface WeeklyBossPreview {
  theme: "The Half-Truth Hydra";
  weekNumber: 1 | 2;
  topRelations: DistractorRelation[];
  topCauses: ErrorCause[];
  itemReasons: Array<{ itemId: string; reason: string }>;
}

function completedSprintDays(state: StudentStudyState) {
  return new Set(
    state.missionHistory
      .filter(
        (mission) => mission.dayNumber > 0 && mission.mode !== "weekly-boss",
      )
      .map((mission) => mission.dayNumber),
  );
}

export function buildSprintRoadmap(
  state: StudentStudyState,
): SprintRoadmapDay[] {
  const completed = completedSprintDays(state);
  const currentDay = state.activeMission?.dayNumber || completed.size + 1;
  const startDate =
    state.studyPlan?.onboardingCompletedAt?.slice(0, 10) ??
    state.onboarding?.completedAt.slice(0, 10) ??
    "2026-08-10";
  return roadmapFocus.map(([title, detail], index) => {
    const dayNumber = index + 1;
    return {
      dayNumber,
      title,
      detail,
      dateKey: addDays(startDate, index),
      status: completed.has(dayNumber)
        ? "complete"
        : dayNumber === currentDay
          ? "current"
          : "upcoming",
      bossDay: dayNumber === 7 || dayNumber === 14,
    };
  });
}

export function getRecoveryPassAvailability(state: StudentStudyState) {
  const day = Math.max(
    1,
    state.activeMission?.dayNumber || completedSprintDays(state).size + 1,
  );
  const period = (day <= 7 ? 1 : 2) as 1 | 2;
  const use = state.recoveryPassUses.find((entry) => entry.period === period);
  return {
    period,
    available: !use,
    protectedDate: use?.protectedDate ?? null,
  };
}

export function getStreakReason(mission: StudyMission): StreakReason | null {
  if (mission.mode === "tutor-assigned") return "tutor-assigned";
  const hasReview = mission.items.some((item) => item.part === "review");
  if (hasReview) return "due-review";
  const hasThinking = mission.items.some((item) => item.part === "thinking");
  const hasTransfer = mission.items.some((item) => item.part === "transfer");
  if (hasThinking && hasTransfer) return "full-correction-loop";
  if (hasTransfer) return "transfer-check";
  return null;
}

export function deriveMilestones(
  state: StudentStudyState,
  verifiedCorrectionCount: number,
): MilestoneMoment[] {
  const d2Pass = state.retentionSchedules.some(
    (schedule) => schedule.cadence === "D2" && schedule.outcome === "secure",
  );
  const d7Pass = state.retentionSchedules.some(
    (schedule) => schedule.cadence === "D7" && schedule.outcome === "secure",
  );
  const resolvedCount = state.patterns.filter(
    (pattern) => pattern.status === "resolved",
  ).length;
  return [
    {
      id: "first-verified-correction",
      title: "First verified correction",
      detail:
        "A tutor checked the cause instead of treating a rule suggestion as fact.",
      achieved: verifiedCorrectionCount > 0,
    },
    {
      id: "first-d2-pass",
      title: "First Day 2 pass",
      detail: "A correction held on a distinct return after two days.",
      achieved: d2Pass,
    },
    {
      id: "first-d7-pass",
      title: "First Day 7 pass",
      detail: "A correction survived a week and a different practice surface.",
      achieved: d7Pass,
    },
    {
      id: "three-resolved-patterns",
      title: "Three patterns resolved",
      detail:
        "Three patterns met the distinct transfer and retention criteria.",
      achieved: resolvedCount >= 3,
    },
  ];
}

export function createLightDayMission(
  mission: StudyMission,
  nowIso: string,
): StudyMission {
  if (
    mission.startedAt ||
    mission.completedAt ||
    mission.mode === "weekly-boss"
  ) {
    return mission;
  }
  const selected =
    mission.items.find((item) => item.part === "review") ??
    mission.items.find((item) => item.part === "transfer") ??
    mission.items.find((item) => item.part === "thinking") ??
    mission.items[0];
  if (!selected) return mission;
  const earnsStreak =
    selected.part === "review" || selected.part === "transfer";
  return {
    ...mission,
    mode: "light",
    title: earnsStreak
      ? `Light Day: keep one correction alive`
      : `Light Day: two useful minutes, no streak pressure`,
    estimatedMinutes: 2,
    items: [
      {
        ...selected,
        selectionReason: earnsStreak
          ? "Chosen because this due or transfer work can protect a real correction in about two minutes."
          : "No due review or transfer is available, so this Light Day is useful practice without streak credit.",
      },
    ],
    currentIndex: 0,
    drafts: {},
    attemptIdsByEntry: {},
    elapsedSeconds: 0,
    lastSavedAt: nowIso,
  };
}

function countFrequent<T extends string>(values: T[]) {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort(
      ([leftValue, leftCount], [rightValue, rightCount]) =>
        rightCount - leftCount || leftValue.localeCompare(rightValue),
    )
    .map(([value]) => value);
}

function categoryForCause(cause: ErrorCause | undefined): MistakeCategory {
  if (cause === "grammar-morphology-failure" || cause === "spelling-failure") {
    return "word-form";
  }
  if (
    cause === "scope-expanded" ||
    cause === "scope-narrowed" ||
    cause === "modality-strengthened" ||
    cause === "modality-weakened"
  ) {
    return "inference-overreach";
  }
  if (cause === "example-main-point-confusion") return "purpose-confusion";
  return "evidence-drift";
}

export function buildWeeklyBossPreview(
  state: StudentStudyState,
): WeeklyBossPreview {
  const topRelations = countFrequent(
    state.diagnoses
      .map((diagnosis) => diagnosis.distractorRelation)
      .filter((relation): relation is DistractorRelation => relation !== null),
  );
  if (topRelations.length === 0) topRelations.push("half-true", "too-broad");
  const causeInputs = state.patterns.flatMap((pattern) =>
    pattern.errorCause
      ? Array.from(
          { length: Math.max(1, pattern.recurrenceCount) },
          () => pattern.errorCause,
        )
      : [],
  );
  const topCauses = countFrequent(
    causeInputs.filter((cause): cause is ErrorCause => cause !== null),
  );
  if (topCauses.length === 0) topCauses.push("evidence-misread");

  const firstRelation = topRelations[0] ?? "half-true";
  const relationCandidates = practiceItems.filter((item) => {
    if (item.kind !== "reading-question") return false;
    return Object.values(
      getItemDiagnosticMetadata(item).optionDistractorTags,
    ).includes(firstRelation);
  });
  const firstReading =
    relationCandidates[0] ??
    practiceItems.find((item) => item.kind === "reading-question");
  const secondReading = practiceItems.find(
    (item) =>
      item.kind === "reading-question" &&
      item.id !== firstReading?.id &&
      item.taskType !== firstReading?.taskType,
  );
  const topCause = topCauses[0];
  const wordItem =
    completeWordsItems[
      (state.missionHistory.filter((mission) => mission.dayNumber > 0).length +
        2) %
        completeWordsItems.length
    ];
  const targetCategory = categoryForCause(topCause);
  const transfer =
    transferItems.find((item) => item.mistakeCategory === targetCategory) ??
    transferItems[0];
  const reasons = new Map<string, string>();
  if (firstReading) {
    reasons.set(
      firstReading.id,
      `Chosen because “${distractorRelationLabels[firstRelation]}” is the most frequent reviewed option relationship in the current trace.`,
    );
  }
  if (secondReading) {
    reasons.set(
      secondReading.id,
      `Chosen to test the same correction across ${secondReading.taskType === "daily-life" ? "daily-life reading" : "an academic passage"}, not by repeating one surface.`,
    );
  }
  if (wordItem) {
    reasons.set(
      wordItem.id,
      topCause === "grammar-morphology-failure"
        ? "Chosen because grammar and morphology remains one of the most recurrent verified causes."
        : "Chosen as a short language-form switch so the challenge stays genuinely mixed.",
    );
  }
  if (transfer) {
    reasons.set(
      transfer.id,
      `Chosen to transfer “${topCause ? errorCauseLabels[topCause] : "evidence control"}” to a fresh surface; this result alone cannot resolve the pattern.`,
    );
  }
  return {
    theme: "The Half-Truth Hydra",
    weekNumber: completedSprintDays(state).size >= 7 ? 2 : 1,
    topRelations: topRelations.slice(0, 2),
    topCauses: topCauses.slice(0, 2),
    itemReasons: [firstReading, secondReading, wordItem, transfer]
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .filter(
        (item, index, items) =>
          items.findIndex((candidate) => candidate.id === item.id) === index,
      )
      .map((item) => ({
        itemId: item.id,
        reason:
          reasons.get(item.id) ??
          "Chosen for a distinct mixed practice surface.",
      })),
  };
}

export function createWeeklyBossMission(
  state: StudentStudyState,
  clock: Clock,
): StudyMission {
  const preview = buildWeeklyBossPreview(state);
  const now = clock.now().toISOString();
  const dateKey = toDateKey(clock.now());
  const topCause = preview.topCauses[0];
  const targetCategory = categoryForCause(topCause);
  const reasonByItem = new Map(
    preview.itemReasons.map((item) => [item.itemId, item.reason]),
  );
  const items: MissionItemRef[] = preview.itemReasons.map((entry, index) => {
    const item = practiceItems.find(
      (candidate) => candidate.id === entry.itemId,
    );
    const part =
      item?.kind === "complete-words"
        ? "speed"
        : item?.kind === "transfer"
          ? "transfer"
          : "thinking";
    return {
      entryId: `boss-w${preview.weekNumber}-${index + 1}-${entry.itemId}`,
      itemId: entry.itemId,
      part,
      selectionReason: reasonByItem.get(entry.itemId),
    };
  });
  return {
    id: `weekly-boss-${dateKey}-week-${preview.weekNumber}`,
    studentId: state.studentId,
    dayNumber: 0,
    dateKey,
    title: `${preview.theme}: Week ${preview.weekNumber} mixed correction`,
    primaryTarget: targetCategory,
    primaryTargetLabel: topCause
      ? errorCauseLabels[topCause]
      : "Evidence control",
    estimatedMinutes: 8,
    mode: "weekly-boss",
    items,
    currentIndex: 0,
    drafts: {},
    attemptIdsByEntry: {},
    elapsedSeconds: 0,
    startedAt: null,
    lastSavedAt: now,
    completedAt: null,
  };
}

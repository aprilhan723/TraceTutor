import {
  academicQuestions,
  completeWordsItems,
  dailyLifeQuestions,
  transferItems,
} from "@/data/practice-content";
import type { MistakeCategory } from "@/domain/models";
import type {
  DailyStudyMinutes,
  MainStruggle,
  MissionItemRef,
  StudentStudyState,
  StudyMission,
} from "@/domain/study";
import type { Clock } from "@/lib/clock";
import { addDays, toDateKey } from "@/lib/clock";

const struggleTargets: Record<
  MainStruggle,
  { category: MistakeCategory; label: string }
> = {
  vocabulary: { category: "word-form", label: "Word-form signal" },
  "finding-evidence": { category: "evidence-drift", label: "Evidence drift" },
  inference: {
    category: "inference-overreach",
    label: "Inference overreach",
  },
  "time-pressure": {
    category: "evidence-drift",
    label: "Efficient evidence tracing",
  },
  "not-sure": { category: "evidence-drift", label: "Evidence drift" },
};

function completedSprintDays(state: StudentStudyState) {
  return state.missionHistory.filter((mission) => mission.dayNumber > 0).length;
}

export function getProgramDateKey(state: StudentStudyState, clock: Clock) {
  return addDays(toDateKey(clock.now()), completedSprintDays(state));
}

export function getNextDayNumber(state: StudentStudyState) {
  return Math.min(15, completedSprintDays(state) + 1);
}

function speedItemCount(minutes: DailyStudyMinutes) {
  return minutes === 5 ? 2 : 3;
}

function createEntry(
  itemId: string,
  part: MissionItemRef["part"],
  suffix: string,
): MissionItemRef {
  return {
    entryId: `${part}-${itemId}-${suffix}`,
    itemId,
    part,
  };
}

function chooseTransferItem(category: MistakeCategory) {
  return (
    transferItems.find((item) => item.mistakeCategory === category) ??
    transferItems[0]
  );
}

export function createMissionForState(
  state: StudentStudyState,
  clock: Clock,
): StudyMission | null {
  if (!state.onboarding) {
    return null;
  }

  if (state.activeMission && !state.activeMission.completedAt) {
    return state.activeMission;
  }

  const dayNumber = getNextDayNumber(state);
  if (dayNumber > 14) {
    return null;
  }

  const dateKey = getProgramDateKey(state, clock);
  const target = struggleTargets[state.onboarding.mainStruggle];
  const items: MissionItemRef[] = [];

  const dueRetention = state.retentionSchedules
    .filter(
      (schedule) =>
        schedule.cadence !== "immediate" &&
        !schedule.completedAt &&
        schedule.dueDate.localeCompare(dateKey) <= 0,
    )
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0];

  const dueReview = state.reviewSchedules
    .filter(
      (review) =>
        !review.completedAt && review.dueDate.localeCompare(dateKey) <= 0,
    )
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0];

  if (dueRetention) {
    items.push({
      entryId: `retention-${dueRetention.id}`,
      itemId: dueRetention.itemId,
      part: "review",
      retentionScheduleId: dueRetention.id,
      retentionCadence: dueRetention.cadence,
      reviewCadence: dueRetention.cadence === "D2" ? "D2" : "D7",
      sourceDiagnosisId: dueRetention.diagnosisId,
    });
  } else if (dueReview) {
    items.push({
      entryId: `review-${dueReview.id}`,
      itemId: dueReview.itemId,
      part: "review",
      reviewScheduleId: dueReview.id,
      reviewCadence: dueReview.cadence,
    });
  }

  const ctwCount = speedItemCount(state.onboarding.dailyStudyMinutes);
  for (let index = 0; index < ctwCount; index += 1) {
    const contentIndex =
      ((dayNumber - 1) * 3 + index) % completeWordsItems.length;
    const item = completeWordsItems[contentIndex];
    if (item) {
      items.push(createEntry(item.id, "speed", `day-${dayNumber}`));
    }
  }

  const thinkingPool =
    dayNumber % 2 === 1 ? dailyLifeQuestions : academicQuestions;
  const thinkingIndex = Math.floor((dayNumber - 1) / 2) % thinkingPool.length;
  const thinkingItem = thinkingPool[thinkingIndex];
  if (thinkingItem) {
    items.push(createEntry(thinkingItem.id, "thinking", `day-${dayNumber}`));
  }

  if (state.onboarding.dailyStudyMinutes === 15) {
    const extraPool =
      dayNumber % 2 === 1 ? academicQuestions : dailyLifeQuestions;
    const extraItem = extraPool[thinkingIndex % extraPool.length];
    if (extraItem) {
      items.push(
        createEntry(extraItem.id, "thinking", `extra-day-${dayNumber}`),
      );
    }
  }

  const transferTriggered = state.attempts.some(
    (attempt) => attempt.result !== "secure",
  );
  if (transferTriggered) {
    const transferItem = chooseTransferItem(target.category);
    if (transferItem) {
      items.push(createEntry(transferItem.id, "transfer", `day-${dayNumber}`));
    }
  }

  const now = clock.now().toISOString();
  return {
    id: `mission-${dateKey}-day-${String(dayNumber).padStart(2, "0")}`,
    studentId: state.studentId,
    dayNumber,
    dateKey,
    title: `Day ${dayNumber}: Correct the pattern, then prove the transfer`,
    primaryTarget: target.category,
    primaryTargetLabel: target.label,
    estimatedMinutes: state.onboarding.dailyStudyMinutes,
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

export function getDueReviews(state: StudentStudyState, clock: Clock) {
  const dateKey = getProgramDateKey(state, clock);
  return state.reviewSchedules
    .filter(
      (review) =>
        !review.completedAt && review.dueDate.localeCompare(dateKey) <= 0,
    )
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
}

export function getDueRetentionSchedules(
  state: StudentStudyState,
  clock: Clock,
) {
  const dateKey = getProgramDateKey(state, clock);
  return state.retentionSchedules
    .filter(
      (schedule) =>
        schedule.cadence !== "immediate" &&
        !schedule.completedAt &&
        schedule.dueDate.localeCompare(dateKey) <= 0,
    )
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
}

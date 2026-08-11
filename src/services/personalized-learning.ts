import type {
  CorrectionStreakStats,
  DailyLearnerProgress,
  LearnerStudyPlan,
  LearningStyle,
  OnboardingProfile,
  ReadingPriority,
  StudentStudyState,
} from "@/domain/study";
import { addDays } from "@/lib/clock";

const dayFormatterCache = new Map<string, Intl.DateTimeFormat>();

export function isValidTimeZone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export function toLocalDateKey(date: Date, timezone: string) {
  const safeTimezone = isValidTimeZone(timezone) ? timezone : "UTC";
  let formatter = dayFormatterCache.get(safeTimezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: safeTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dayFormatterCache.set(safeTimezone, formatter);
  }
  const parts = formatter.formatToParts(date);
  const read = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

export function calculateWeeklyGoalMinutes(
  defaultDailyMinutes: number,
  studyDaysPerWeek: number,
) {
  return Math.max(30, Math.min(840, defaultDailyMinutes * studyDaysPerWeek));
}

function legacyPriority(profile: OnboardingProfile): ReadingPriority {
  if (profile.mainStruggle === "vocabulary") return "complete-words";
  if (profile.mainStruggle === "finding-evidence") return "mistake-review";
  if (profile.mainStruggle === "inference") return "academic";
  return "balanced";
}

export function createStudyPlanFromLegacy(
  profile: OnboardingProfile | null,
  nowIso: string,
  timezone = "UTC",
): LearnerStudyPlan {
  const defaultDailyMinutes = Math.max(10, profile?.dailyStudyMinutes ?? 10);
  return {
    learningStyle: "daily-rhythm",
    defaultDailyMinutes,
    weeklyGoalMinutes: calculateWeeklyGoalMinutes(defaultDailyMinutes, 5),
    studyDaysPerWeek: 5,
    currentReadingLevel: null,
    targetReadingScore: null,
    targetTestDate: profile?.targetTestDate || null,
    readingPriority: profile ? legacyPriority(profile) : "balanced",
    timezone: isValidTimeZone(timezone) ? timezone : "UTC",
    preferredStudyTime: profile?.reminderTime || null,
    onboardingCompletedAt: null,
    updatedAt: nowIso,
  };
}

export function createDefaultStudyPlan(input: {
  learningStyle?: LearningStyle;
  nowIso: string;
  timezone?: string;
}): LearnerStudyPlan {
  const learningStyle = input.learningStyle ?? "daily-rhythm";
  const defaultDailyMinutes = learningStyle === "deep-focus" ? 60 : 15;
  const studyDaysPerWeek = learningStyle === "deep-focus" ? 4 : 5;
  return {
    learningStyle,
    defaultDailyMinutes,
    weeklyGoalMinutes: calculateWeeklyGoalMinutes(
      defaultDailyMinutes,
      studyDaysPerWeek,
    ),
    studyDaysPerWeek,
    currentReadingLevel: null,
    targetReadingScore: null,
    targetTestDate: null,
    readingPriority: "balanced",
    timezone: isValidTimeZone(input.timezone ?? "")
      ? (input.timezone ?? "UTC")
      : "UTC",
    preferredStudyTime: null,
    onboardingCompletedAt: null,
    updatedAt: input.nowIso,
  };
}

export function getOrCreateDailyProgress(
  state: Pick<StudentStudyState, "dailyProgress" | "studentId" | "studyPlan">,
  localDate: string,
  nowIso: string,
): DailyLearnerProgress {
  return (
    state.dailyProgress.find((entry) => entry.localDate === localDate) ?? {
      learnerId: state.studentId,
      localDate,
      activeSeconds: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      reviewsCompleted: 0,
      transferItemsCompleted: 0,
      diagnosticsCompleted: 0,
      dailyCoreCompleted: false,
      streakEligible: false,
      goalMinutes: state.studyPlan?.defaultDailyMinutes ?? 10,
      createdAt: nowIso,
      updatedAt: nowIso,
    }
  );
}

export function upsertDailyProgress(
  entries: DailyLearnerProgress[],
  next: DailyLearnerProgress,
) {
  const without = entries.filter((entry) => entry.localDate !== next.localDate);
  return [...without, next].sort((left, right) =>
    left.localDate.localeCompare(right.localDate),
  );
}

export function calculateCorrectionStreak(
  progress: DailyLearnerProgress[],
  todayKey: string,
  protectedDates: string[] = [],
): CorrectionStreakStats {
  const eligible = new Set(
    progress
      .filter((entry) => entry.streakEligible)
      .map((entry) => entry.localDate),
  );
  const protectedSet = new Set(protectedDates);
  const sorted = [...eligible].sort();
  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of sorted) {
    if (previous && addDays(previous, 1) === date) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    previous = date;
  }

  let cursor = eligible.has(todayKey) ? todayKey : addDays(todayKey, -1);
  let current = 0;
  let guard = 0;
  while (guard < 370) {
    if (eligible.has(cursor)) current += 1;
    else if (!protectedSet.has(cursor)) break;
    cursor = addDays(cursor, -1);
    guard += 1;
  }
  return {
    current,
    longest: Math.max(longest, current),
    lastEligibleLocalDate: sorted.at(-1) ?? null,
  };
}

export function markDailyCoreComplete(input: {
  state: StudentStudyState;
  localDate: string;
  nowIso: string;
}) {
  const existing = getOrCreateDailyProgress(
    input.state,
    input.localDate,
    input.nowIso,
  );
  if (existing.dailyCoreCompleted && existing.streakEligible) {
    return input.state;
  }
  const dailyProgress = upsertDailyProgress(input.state.dailyProgress, {
    ...existing,
    dailyCoreCompleted: true,
    streakEligible: true,
    updatedAt: input.nowIso,
  });
  const streakStats = calculateCorrectionStreak(
    dailyProgress,
    input.localDate,
    input.state.recoveryPassUses.map((entry) => entry.protectedDate),
  );
  return {
    ...input.state,
    dailyProgress,
    streakStats,
    correctionStreak: streakStats.current,
    updatedAt: input.nowIso,
  };
}

export function markQualifyingWorkComplete(input: {
  state: StudentStudyState;
  localDate: string;
  nowIso: string;
}) {
  const existing = getOrCreateDailyProgress(
    input.state,
    input.localDate,
    input.nowIso,
  );
  if (existing.streakEligible) return input.state;
  const dailyProgress = upsertDailyProgress(input.state.dailyProgress, {
    ...existing,
    streakEligible: true,
    updatedAt: input.nowIso,
  });
  const streakStats = calculateCorrectionStreak(
    dailyProgress,
    input.localDate,
    input.state.recoveryPassUses.map((entry) => entry.protectedDate),
  );
  return {
    ...input.state,
    dailyProgress,
    streakStats,
    correctionStreak: streakStats.current,
    updatedAt: input.nowIso,
  };
}

export function addDailyActivity(input: {
  state: StudentStudyState;
  localDate: string;
  nowIso: string;
  activeSeconds?: number;
  questionsAnswered?: number;
  correctAnswers?: number;
  reviewsCompleted?: number;
  transferItemsCompleted?: number;
  diagnosticsCompleted?: number;
}) {
  const existing = getOrCreateDailyProgress(
    input.state,
    input.localDate,
    input.nowIso,
  );
  const next: DailyLearnerProgress = {
    ...existing,
    activeSeconds: existing.activeSeconds + (input.activeSeconds ?? 0),
    questionsAnswered:
      existing.questionsAnswered + (input.questionsAnswered ?? 0),
    correctAnswers: existing.correctAnswers + (input.correctAnswers ?? 0),
    reviewsCompleted: existing.reviewsCompleted + (input.reviewsCompleted ?? 0),
    transferItemsCompleted:
      existing.transferItemsCompleted + (input.transferItemsCompleted ?? 0),
    diagnosticsCompleted:
      existing.diagnosticsCompleted + (input.diagnosticsCompleted ?? 0),
    updatedAt: input.nowIso,
  };
  return {
    ...input.state,
    dailyProgress: upsertDailyProgress(input.state.dailyProgress, next),
    updatedAt: input.nowIso,
  };
}

export function calculateWeeklyActivity(
  progress: DailyLearnerProgress[],
  todayKey: string,
) {
  const start = addDays(todayKey, -6);
  const days = progress.filter(
    (entry) => entry.localDate >= start && entry.localDate <= todayKey,
  );
  return {
    activeSeconds: days.reduce((sum, day) => sum + day.activeSeconds, 0),
    activeDays: days.filter(
      (day) => day.activeSeconds > 0 || day.questionsAnswered > 0,
    ).length,
  };
}

export type ConsistencyStatus =
  "core-complete" | "study-only" | "today" | "future" | "missed";

export function buildSevenDayConsistency(
  progress: DailyLearnerProgress[],
  todayKey: string,
) {
  const start = addDays(todayKey, -3);
  const byDate = new Map(progress.map((entry) => [entry.localDate, entry]));
  return Array.from({ length: 7 }, (_, index) => {
    const dateKey = addDays(start, index);
    const entry = byDate.get(dateKey);
    let status: ConsistencyStatus;
    if (dateKey > todayKey) status = "future";
    else if (entry?.dailyCoreCompleted) status = "core-complete";
    else if (entry && (entry.activeSeconds > 0 || entry.questionsAnswered > 0))
      status = "study-only";
    else if (dateKey === todayKey) status = "today";
    else status = "missed";
    return { dateKey, status, progress: entry ?? null };
  });
}

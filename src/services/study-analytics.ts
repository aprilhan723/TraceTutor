import type {
  StudentProgressMetrics,
  StudentStudyState,
  TaskAccuracyMetric,
} from "@/domain/study";
import type { ReadingTaskType } from "@/domain/models";
import { addDays } from "@/lib/clock";
import { calculateWeeklyActivity } from "@/services/personalized-learning";

const taskLabels: Record<ReadingTaskType, string> = {
  "complete-the-words": "Complete the Words",
  "daily-life": "Read in Daily Life",
  "academic-passage": "Academic Passage",
};

function percentage(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);
}

export function calculateProgressMetrics(
  state: StudentStudyState,
): StudentProgressMetrics {
  const taskTypes = Object.keys(taskLabels) as ReadingTaskType[];
  const taskAccuracy: TaskAccuracyMetric[] = taskTypes.map((taskType) => {
    const attempts = state.attempts.filter(
      (attempt) => attempt.taskType === taskType,
    );
    const correct = attempts.filter((attempt) => attempt.correct).length;
    return {
      taskType,
      label: taskLabels[taskType],
      correct,
      total: attempts.length,
      percentage: percentage(correct, attempts.length),
    };
  });

  const evidenceAttempts = state.attempts.filter(
    (attempt) => attempt.evidenceCorrect !== null,
  );
  const evidenceCorrect = evidenceAttempts.filter(
    (attempt) => attempt.evidenceCorrect,
  ).length;
  const confidenceAttempts = state.attempts.filter(
    (attempt) => attempt.confidence !== null,
  );
  const calibratedAttempts = confidenceAttempts.filter((attempt) => {
    if (attempt.confidence === "certain") {
      return attempt.correct;
    }
    if (attempt.confidence === "guessing") {
      return !attempt.correct;
    }
    return attempt.correct;
  }).length;
  const todayKey =
    state.activeMission?.dateKey ??
    state.dailyProgress.at(-1)?.localDate ??
    state.missionHistory.at(-1)?.dateKey ??
    "1970-01-01";
  const weekly = calculateWeeklyActivity(state.dailyProgress, todayKey);
  const today = state.dailyProgress.find(
    (entry) => entry.localDate === todayKey,
  );
  const attemptsSince = (days: number) =>
    state.attempts.filter(
      (attempt) =>
        attempt.submittedAt.slice(0, 10) >= addDays(todayKey, -days + 1),
    );
  const accuracyFor = (attempts: typeof state.attempts, minimum = 1) =>
    attempts.length < minimum
      ? null
      : percentage(
          attempts.filter((attempt) => attempt.correct).length,
          attempts.length,
        );
  const sevenDayAttempts = attemptsSince(7);
  const thirtyDayAttempts = attemptsSince(30);
  const recentAttempts = state.attempts.slice(-10);
  const certainAttempts = state.attempts.filter(
    (attempt) => attempt.confidence === "certain",
  );
  const completedReviews = state.reviewSchedules.filter(
    (review) => review.completedAt,
  ).length;
  const retentionFor = (cadence: "immediate" | "D2" | "D7") => {
    const entries = state.retentionSchedules.filter(
      (schedule) => schedule.cadence === cadence && schedule.completedAt,
    );
    return entries.length === 0
      ? null
      : percentage(
          entries.filter((schedule) => schedule.outcome === "secure").length,
          entries.length,
        );
  };

  return {
    taskAccuracy,
    evidenceCorrect,
    evidenceTotal: evidenceAttempts.length,
    evidencePercentage: percentage(evidenceCorrect, evidenceAttempts.length),
    calibratedAttempts,
    confidenceAttempts: confidenceAttempts.length,
    calibrationPercentage: percentage(
      calibratedAttempts,
      confidenceAttempts.length,
    ),
    currentCorrectionStreak: state.streakStats.current,
    longestCorrectionStreak: state.streakStats.longest,
    todayActiveMinutes:
      Math.round(((today?.activeSeconds ?? 0) / 60) * 10) / 10,
    weeklyActiveMinutes: Math.round((weekly.activeSeconds / 60) * 10) / 10,
    weeklyGoalMinutes: state.studyPlan?.weeklyGoalMinutes ?? 50,
    activeStudyDays: weekly.activeDays,
    totalQuestionsAnswered: state.attempts.length,
    recentAccuracy: accuracyFor(recentAttempts),
    sevenDayAccuracy: accuracyFor(sevenDayAttempts, 3),
    thirtyDayAccuracy: accuracyFor(thirtyDayAttempts, 6),
    highConfidenceWrongRate:
      certainAttempts.length === 0
        ? null
        : percentage(
            certainAttempts.filter((attempt) => !attempt.correct).length,
            certainAttempts.length,
          ),
    dueReviewCompletionRate:
      state.reviewSchedules.length === 0
        ? null
        : percentage(completedReviews, state.reviewSchedules.length),
    immediateTransferRate: retentionFor("immediate"),
    d2RetentionRate: retentionFor("D2"),
    d7RetentionRate: retentionFor("D7"),
    recurringErrorCount: state.patterns.filter(
      (pattern) =>
        pattern.status === "recurring" || pattern.recurrenceCount >= 3,
    ).length,
    correctedErrorCount: state.patterns.filter(
      (pattern) =>
        pattern.status === "improving" || pattern.status === "resolved",
    ).length,
    hasAccuracyTrend: thirtyDayAttempts.length >= 6,
  };
}

import type {
  StudentProgressMetrics,
  StudentStudyState,
  TaskAccuracyMetric,
} from "@/domain/study";
import type { ReadingTaskType } from "@/domain/models";

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
  };
}

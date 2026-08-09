import type { MistakeCategory, ReadingTaskType } from "@/domain/models";

export const readingConfidenceLevels = [
  "beginner",
  "developing",
  "strong",
] as const;

export type ReadingConfidence = (typeof readingConfidenceLevels)[number];

export const dailyStudyTimes = [5, 10, 15] as const;
export type DailyStudyMinutes = (typeof dailyStudyTimes)[number];

export const mainStruggles = [
  "vocabulary",
  "finding-evidence",
  "inference",
  "time-pressure",
  "not-sure",
] as const;

export type MainStruggle = (typeof mainStruggles)[number];

export interface OnboardingProfile {
  targetTestDate: string;
  readingConfidence: ReadingConfidence;
  dailyStudyMinutes: DailyStudyMinutes;
  reminderTime: string;
  mainStruggle: MainStruggle;
  completedAt: string;
}

export type AnswerConfidence = "guessing" | "think-so" | "certain";
export type ResultState = "secure" | "unstable" | "diagnose";
export type PatternStatus =
  "new" | "working" | "unstable" | "improving" | "resolved";

export interface ChoiceOption {
  id: string;
  label: string;
}

export interface StimulusSegment {
  id: string;
  text: string;
}

export interface ReadingStimulus {
  id: string;
  type: "daily-life" | "academic-passage";
  eyebrow: string;
  title: string;
  context: string;
  segments: StimulusSegment[];
}

interface PracticeItemBase {
  id: string;
  taskType: ReadingTaskType;
  mistakeCategory: MistakeCategory;
  title: string;
  explanation: string;
}

export interface CompleteWordsItem extends PracticeItemBase {
  kind: "complete-words";
  taskType: "complete-the-words";
  paragraphBefore: string;
  wordPrefix: string;
  paragraphAfter: string;
  answerEnding: string;
  acceptedAnswers: string[];
}

export interface ReadingQuestionItem extends PracticeItemBase {
  kind: "reading-question";
  taskType: "daily-life" | "academic-passage";
  stimulusId: string;
  prompt: string;
  options: ChoiceOption[];
  correctOptionId: string;
  correctEvidenceSegmentIds: string[];
}

export interface TransferItem extends PracticeItemBase {
  kind: "transfer";
  taskType: "daily-life" | "academic-passage";
  prompt: string;
  microContext: string;
  options: ChoiceOption[];
  correctOptionId: string;
}

export type PracticeItem =
  CompleteWordsItem | ReadingQuestionItem | TransferItem;

export type MissionPartKind = "review" | "speed" | "thinking" | "transfer";
export type ReviewCadence = "D2" | "D7";

export interface MissionItemRef {
  entryId: string;
  itemId: PracticeItem["id"];
  part: MissionPartKind;
  reviewScheduleId?: string;
  reviewCadence?: ReviewCadence;
}

export interface AnswerDraft {
  typedAnswer?: string;
  selectedOptionId?: string;
  confidence?: AnswerConfidence;
  evidenceSegmentIds: string[];
  savedAt: string;
}

export interface StudyMission {
  id: string;
  studentId: string;
  dayNumber: number;
  dateKey: string;
  title: string;
  primaryTarget: MistakeCategory;
  primaryTargetLabel: string;
  estimatedMinutes: DailyStudyMinutes;
  items: MissionItemRef[];
  currentIndex: number;
  drafts: Record<string, AnswerDraft>;
  attemptIdsByEntry: Record<string, string>;
  elapsedSeconds: number;
  startedAt: string | null;
  lastSavedAt: string;
  completedAt: string | null;
}

export interface StudyAttempt {
  id: string;
  missionId: string;
  missionEntryId: string;
  itemId: PracticeItem["id"];
  taskType: ReadingTaskType;
  response: string;
  confidence: AnswerConfidence | null;
  evidenceSegmentIds: string[];
  correct: boolean;
  evidenceCorrect: boolean | null;
  result: ResultState;
  submittedAt: string;
  reviewOfAttemptId: string | null;
}

export interface ReviewSchedule {
  id: string;
  sourceAttemptId: string;
  itemId: PracticeItem["id"];
  cadence: ReviewCadence;
  dueDate: string;
  completedAt: string | null;
}

export interface MissionHistoryRecord {
  missionId: string;
  dayNumber: number;
  dateKey: string;
  title: string;
  completedAt: string;
  secureCount: number;
  attemptCount: number;
  estimatedMinutes: number;
}

export interface StudentPatternRecord {
  id: string;
  category: MistakeCategory;
  label: string;
  description: string;
  status: PatternStatus;
  recurrenceCount: number;
  secureCount: number;
  lastSeenAt: string;
}

export interface StudentStudyState {
  version: 2;
  studentId: string;
  onboarding: OnboardingProfile | null;
  correctionStreak: number;
  recoveryPasses: number;
  activeMission: StudyMission | null;
  attempts: StudyAttempt[];
  reviewSchedules: ReviewSchedule[];
  missionHistory: MissionHistoryRecord[];
  patterns: StudentPatternRecord[];
  updatedAt: string;
}

export interface TaskAccuracyMetric {
  taskType: ReadingTaskType;
  label: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface StudentProgressMetrics {
  taskAccuracy: TaskAccuracyMetric[];
  evidenceCorrect: number;
  evidenceTotal: number;
  evidencePercentage: number;
  calibratedAttempts: number;
  confidenceAttempts: number;
  calibrationPercentage: number;
}

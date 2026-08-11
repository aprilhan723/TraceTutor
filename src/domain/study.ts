import type { MistakeCategory, ReadingTaskType } from "@/domain/models";
import type {
  DiagnosisRecord,
  ErrorCause,
  ProbeResponse,
  ProcessStage,
  RetentionCadence,
  RetentionOutcome,
  RetentionSchedule,
} from "@/domain/mistake-intelligence";

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

export const learningStyles = ["daily-rhythm", "deep-focus"] as const;
export type LearningStyle = (typeof learningStyles)[number];

export const readingPriorities = [
  "balanced",
  "complete-words",
  "daily-life",
  "academic",
  "mistake-review",
] as const;
export type ReadingPriority = (typeof readingPriorities)[number];

export const studyMinutePresets = [10, 15, 30, 45, 60, 90, 120] as const;
export type StudyMinutePreset = (typeof studyMinutePresets)[number];

export interface LearnerStudyPlan {
  learningStyle: LearningStyle;
  defaultDailyMinutes: number;
  weeklyGoalMinutes: number;
  studyDaysPerWeek: number;
  currentReadingLevel: number | null;
  targetReadingScore: number | null;
  targetTestDate: string | null;
  readingPriority: ReadingPriority;
  timezone: string;
  preferredStudyTime: string | null;
  onboardingCompletedAt: string | null;
  updatedAt: string;
}

export type AnswerConfidence = "guessing" | "think-so" | "certain";
export type ResultState = "secure" | "unstable" | "diagnose";
export type PatternStatus =
  "new" | "working" | "unstable" | "improving" | "resolved" | "recurring";

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
export type MissionMode =
  "standard" | "light" | "weekly-boss" | "tutor-assigned" | "study-session";
export type StreakReason =
  "due-review" | "full-correction-loop" | "transfer-check" | "tutor-assigned";

export const milestoneIds = [
  "first-verified-correction",
  "first-d2-pass",
  "first-d7-pass",
  "three-resolved-patterns",
] as const;

export type MilestoneId = (typeof milestoneIds)[number];

export interface MissionItemRef {
  entryId: string;
  itemId: PracticeItem["id"];
  part: MissionPartKind;
  reviewScheduleId?: string;
  reviewCadence?: ReviewCadence;
  retentionScheduleId?: string;
  retentionCadence?: RetentionCadence;
  sourceDiagnosisId?: string;
  selectionReason?: string;
}

export interface AnswerDraft {
  typedAnswer?: string;
  selectedOptionId?: string;
  confidence?: AnswerConfidence;
  evidenceSegmentIds: string[];
  answerChanges?: number;
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
  estimatedMinutes: number;
  mode: MissionMode;
  items: MissionItemRef[];
  dailyCoreEntryIds?: string[];
  sessionId?: string;
  currentIndex: number;
  drafts: Record<string, AnswerDraft>;
  attemptIdsByEntry: Record<string, string>;
  elapsedSeconds: number;
  startedAt: string | null;
  lastSavedAt: string;
  completedAt: string | null;
}

export const studySessionTypes = [
  "daily-core",
  "quick",
  "focused",
  "deep",
  "intensive",
  "custom",
] as const;
export type StudySessionType = (typeof studySessionTypes)[number];
export type StudySessionStatus =
  "planned" | "active" | "paused" | "completed" | "abandoned";
export type StudySessionSource =
  "dashboard" | "tutor-assignment" | "review-queue" | "library";
export type StudyTopic =
  | "adaptive-mix"
  | "complete-words"
  | "daily-life"
  | "academic"
  | "mistake-review"
  | "due-reviews"
  | "timed-mixed";
export type StudyActivityType =
  | "daily-core"
  | "due-review"
  | "complete-words"
  | "daily-life"
  | "academic"
  | "mistake-review"
  | "transfer"
  | "timed-mixed"
  | "break"
  | "summary";

export interface StudyPlanBlock {
  id: string;
  title: string;
  detail: string;
  activityType: StudyActivityType;
  estimatedMinutes: number;
  itemIds: PracticeItem["id"][];
  missionEntryIds: string[];
  status: "upcoming" | "active" | "completed" | "skipped";
  breakMinutes: number;
}

export interface StudySession {
  id: string;
  learnerId: string;
  sessionType: StudySessionType;
  topic: StudyTopic;
  plannedMinutes: number;
  availableMinutes: number;
  activeSeconds: number;
  startedAt: string | null;
  lastActivityAt: string | null;
  completedAt: string | null;
  pausedAt: string | null;
  status: StudySessionStatus;
  questionsAnswered: number;
  correctAnswers: number;
  dueReviewsCompleted: number;
  transferItemsCompleted: number;
  diagnosticLoopsCompleted: number;
  source: StudySessionSource;
  includeDueReviews: boolean;
  timed: boolean;
  blocks: StudyPlanBlock[];
  contentShortage: boolean;
  shortageMessage: string | null;
  endedAfterBlockId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLearnerProgress {
  learnerId: string;
  localDate: string;
  activeSeconds: number;
  questionsAnswered: number;
  correctAnswers: number;
  reviewsCompleted: number;
  transferItemsCompleted: number;
  diagnosticsCompleted: number;
  dailyCoreCompleted: boolean;
  streakEligible: boolean;
  goalMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CorrectionStreakStats {
  current: number;
  longest: number;
  lastEligibleLocalDate: string | null;
}

export interface TutorStudyRecommendation {
  id: string;
  recommendedAt: string;
  weeklyGoalMinutes: number | null;
  readingPriority: ReadingPriority | null;
  sessionType: "focused" | "deep" | null;
  note: string;
  acknowledgedAt: string | null;
  decision: "accepted" | "kept-current" | null;
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
  answerChanges: number;
  elapsedSeconds: number;
  diagnosisId: string | null;
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
  mode: MissionMode;
  correctionStreakEarned: boolean;
  streakReason: StreakReason | null;
  activeMinutes?: number;
}

export interface RecoveryPassUse {
  period: 1 | 2;
  protectedDate: string;
  usedAt: string;
}

export interface OfflineAttemptEvent {
  id: string;
  attemptId: string;
  missionId: string;
  status: "queued" | "reconciled";
  queuedAt: string;
  reconciledAt: string | null;
}

export interface StudentPatternRecord {
  id: string;
  category: MistakeCategory;
  label: string;
  description: string;
  status: PatternStatus;
  errorCause: ErrorCause | null;
  processStage: ProcessStage | null;
  recurrenceCount: number;
  secureCount: number;
  diagnosisIds: string[];
  distinctTransferItemIds: string[];
  recentEvidence: Array<{
    attemptId: string;
    summary: string;
    observedAt: string;
  }>;
  retention: Record<
    Lowercase<RetentionCadence>,
    { outcome: RetentionOutcome | "not-scheduled"; dueDate: string | null }
  >;
  tutorReviewRequired: boolean;
  lastSeenAt: string;
}

export interface StudentStudyState {
  version: 5;
  studentId: string;
  onboarding: OnboardingProfile | null;
  studyPlan: LearnerStudyPlan | null;
  correctionStreak: number;
  streakStats: CorrectionStreakStats;
  recoveryPasses: number;
  recoveryPassUses: RecoveryPassUse[];
  celebratedMilestones: MilestoneId[];
  offlineEvents: OfflineAttemptEvent[];
  activeMission: StudyMission | null;
  parkedMission: StudyMission | null;
  activeSessionId: string | null;
  studySessions: StudySession[];
  dailyProgress: DailyLearnerProgress[];
  tutorRecommendations: TutorStudyRecommendation[];
  attempts: StudyAttempt[];
  reviewSchedules: ReviewSchedule[];
  diagnoses: DiagnosisRecord[];
  probeResponses: ProbeResponse[];
  retentionSchedules: RetentionSchedule[];
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
  currentCorrectionStreak: number;
  longestCorrectionStreak: number;
  todayActiveMinutes: number;
  weeklyActiveMinutes: number;
  weeklyGoalMinutes: number;
  activeStudyDays: number;
  totalQuestionsAnswered: number;
  recentAccuracy: number | null;
  sevenDayAccuracy: number | null;
  thirtyDayAccuracy: number | null;
  highConfidenceWrongRate: number | null;
  dueReviewCompletionRate: number | null;
  immediateTransferRate: number | null;
  d2RetentionRate: number | null;
  d7RetentionRate: number | null;
  recurringErrorCount: number;
  correctedErrorCount: number;
  hasAccuracyTrend: boolean;
}

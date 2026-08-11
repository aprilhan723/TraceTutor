import type { ReadingTaskType } from "@/domain/models";
import type {
  DistractorRelation,
  ErrorCause,
  Skill,
} from "@/domain/mistake-intelligence";
import type { AnswerConfidence, ResultState } from "@/domain/study";
import type { AiDiagnosisAuditSnapshot } from "@/domain/ai-diagnosis";

export const tutorReviewStatuses = [
  "pending",
  "in-review",
  "approved",
  "changed",
  "ambiguous",
] as const;

export type TutorReviewStatus = (typeof tutorReviewStatuses)[number];
export type ContentStatus = "draft" | "reviewed" | "published" | "retired";
export type AdherenceStatus = "completed" | "recovery" | "missed";

export interface MachineDiagnosisSnapshot {
  primaryCause: ErrorCause | null;
  secondaryCauses: ErrorCause[];
  confidence: number;
  observations: Array<{ code: string; label: string; detail: string }>;
  supportingEvidence: string[];
  suggestedAt: string;
}

export interface TutorAttemptSnapshot {
  itemId: string;
  taskType: ReadingTaskType;
  selectedOptionId: string;
  correctOptionId: string;
  selectedEvidenceSegmentIds: string[];
  designatedEvidenceSegmentIds: string[];
  confidence: AnswerConfidence | null;
  elapsedSeconds: number;
  answerChanges: number;
  result: ResultState;
  submittedAt: string;
}

export interface TutorProbeSnapshot {
  probeCode: string;
  prompt: string;
  selectedAnswer: string;
  correct: boolean;
  interpretation: string;
}

export interface TutorRetentionSnapshot {
  cadence: "immediate" | "D2" | "D7";
  itemId: string;
  dueDate: string;
  outcome: "scheduled" | "secure" | "needs-work";
}

export interface TutorAdjudication {
  status: TutorReviewStatus;
  primaryCause: ErrorCause | null;
  secondaryCauses: ErrorCause[];
  assignedTransferItemId: string | null;
  followUpQuestion: string | null;
  ambiguous: boolean;
  addedToLessonBrief: boolean;
  feedback: string | null;
  reviewedByTutorId: string | null;
  reviewedAt: string | null;
  reviewDurationSeconds: number | null;
}

export interface TutorAuditEvent {
  id: string;
  action:
    | "approved"
    | "primary-changed"
    | "secondary-added"
    | "secondary-removed"
    | "transfer-assigned"
    | "follow-up-requested"
    | "ambiguity-marked"
    | "lesson-brief-added"
    | "feedback-sent"
    | "ai-suggestion-recorded";
  summary: string;
  createdAt: string;
  tutorId: string;
}

export interface TutorDiagnosisCase {
  id: string;
  diagnosisId: string;
  studentId: string;
  patternLabel: string;
  skill: Skill;
  recurrenceCount: number;
  studentQuestion: string | null;
  questionResolved: boolean;
  machineSuggestion: MachineDiagnosisSnapshot;
  aiSuggestions?: AiDiagnosisAuditSnapshot[];
  attempt: TutorAttemptSnapshot;
  probe: TutorProbeSnapshot | null;
  retentionHistory: TutorRetentionSnapshot[];
  adjudication: TutorAdjudication;
  auditTrail: TutorAuditEvent[];
  createdAt: string;
}

export interface TutorAdherenceDay {
  dateKey: string;
  status: AdherenceStatus;
  minutes: number;
  accuracy: number | null;
}

export interface TutorStudentProfile {
  studentId: string;
  targetTestDate: string;
  adherence: TutorAdherenceDay[];
  evidenceAccuracy: number;
  confidenceCalibration: number;
  previousConfidenceCalibration: number;
  taskCoverage: Record<ReadingTaskType, number>;
  tutorNotes: string;
}

export interface ContentOptionDraft {
  id: string;
  label: string;
  distractorRelation: DistractorRelation | null;
}

export interface ContentEditorDraft {
  contentKey: string;
  taskType: "daily-life" | "academic-passage";
  skill: Skill;
  title: string;
  stimulusTitle: string;
  stimulusText: string;
  prompt: string;
  options: ContentOptionDraft[];
  correctOptionId: string;
  designatedEvidence: string;
  status: ContentStatus;
}

export interface TutorContentVersion extends ContentEditorDraft {
  id: string;
  version: number;
  parentVersionId: string | null;
  createdAt: string;
  createdByTutorId: string;
}

export interface TutorLessonBriefState {
  studentId: string;
  tutorNotes: string;
  updatedAt: string;
}

export interface TutorWorkspaceState {
  version: 1;
  tutorId: string;
  diagnosisCases: TutorDiagnosisCase[];
  studentProfiles: TutorStudentProfile[];
  contentVersions: TutorContentVersion[];
  lessonBriefs: TutorLessonBriefState[];
  updatedAt: string;
}

export type TutorAdjudicationCommand =
  | { type: "approve"; reviewDurationSeconds?: number }
  | { type: "change-primary"; cause: ErrorCause }
  | { type: "add-secondary"; cause: ErrorCause }
  | { type: "remove-secondary"; cause: ErrorCause }
  | { type: "assign-transfer"; itemId: string }
  | { type: "request-follow-up"; question: string }
  | { type: "mark-ambiguous" }
  | { type: "add-to-lesson-brief" }
  | { type: "send-feedback"; feedback: string };

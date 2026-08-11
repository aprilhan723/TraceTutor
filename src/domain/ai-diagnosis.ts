import type {
  DistractorRelation,
  ErrorCause,
  ProcessStage,
  Skill,
} from "@/domain/mistake-intelligence";
import type { ReadingTaskType } from "@/domain/models";

export const AI_DIAGNOSIS_INPUT_VERSION = "tt-ai-input-v1" as const;
export const AI_DIAGNOSIS_SCHEMA_VERSION = "tt-ai-output-v1" as const;
export const AI_DIAGNOSIS_PROMPT_VERSION = "tt-diagnosis-prompt-v1" as const;

export type TimingBucket = "fast" | "expected" | "slow";
export type AnswerChangeBucket = "none" | "one" | "multiple";

export interface AiRuleCandidate {
  processStage: ProcessStage;
  errorCause: ErrorCause;
  confidence: number;
}

export interface AiDiagnosisInput {
  schemaVersion: typeof AI_DIAGNOSIS_INPUT_VERSION;
  item: {
    taskType: ReadingTaskType;
    skill: Skill;
  };
  selectedOptionRelation: DistractorRelation | null;
  evidence: {
    designatedExcerpt: string;
    selectedExcerpt: string;
    overlapsDesignated: boolean;
  };
  response: {
    confidence: "guessing" | "think-so" | "certain" | null;
    timingBucket: TimingBucket;
    answerChanges: AnswerChangeBucket;
  };
  probeAnswer: {
    probeCode: string;
    selectedAnswer: string;
    interpretation: string;
    correct: boolean;
  } | null;
  priorPattern: {
    primaryCause: ErrorCause | null;
    recurrenceCount: number;
    latestRetention: "scheduled" | "secure" | "needs-work" | null;
  } | null;
  ruleCandidates: AiRuleCandidate[];
  studentExplanation: string | null;
}

export interface AiAlternativeHypothesis {
  processStage: ProcessStage;
  errorCause: ErrorCause;
  reason: string;
}

export interface AiDiagnosisSuggestion {
  primaryProcessStage: ProcessStage;
  primaryErrorCause: ErrorCause;
  confidence: number;
  secondaryCauses: ErrorCause[];
  distractorRelation: DistractorRelation | null;
  supportingEvidence: string[];
  alternativeHypotheses: AiAlternativeHypothesis[];
  recommendedNextStep: {
    kind: "probe" | "remediation" | "abstain";
    prompt: string;
  };
  tutorReviewRequired: boolean;
  tutorReviewReasons: string[];
  studentFacingExplanation: string;
}

export interface AiSuggestionPolicyReview {
  contradictsRule: boolean;
  tutorReviewRequired: boolean;
  reasons: string[];
}

export interface AiUsageSummary {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number | null;
}

export interface AiDiagnosisAuditSnapshot {
  source: "openai" | "evaluation-fixture";
  requestId: string;
  inputFingerprint: string;
  suggestion: AiDiagnosisSuggestion;
  policyReview: AiSuggestionPolicyReview;
  modelVersion: string;
  promptVersion: typeof AI_DIAGNOSIS_PROMPT_VERSION;
  schemaVersion: typeof AI_DIAGNOSIS_SCHEMA_VERSION;
  generatedAt: string;
  usage: AiUsageSummary;
}

export type AiFallbackReason =
  | "disabled"
  | "missing-key"
  | "not-needed"
  | "rate-limited"
  | "circuit-open"
  | "timeout"
  | "provider-error"
  | "malformed-output";

export type AiDiagnosisDecision =
  | { status: "suggested"; audit: AiDiagnosisAuditSnapshot }
  | {
      status: "fallback";
      reason: AiFallbackReason;
      message: string;
      audit: null;
    };

export interface AiActorContext {
  userId: string;
  organizationId: string;
}

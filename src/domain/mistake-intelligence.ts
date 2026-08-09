import type { ReadingTaskType } from "@/domain/models";

export const MISTAKE_TAXONOMY_VERSION = 1 as const;

export const skillTaxonomy = [
  "main-idea",
  "detail",
  "purpose",
  "reference",
  "vocabulary-in-context",
  "inference",
  "text-structure",
  "complete-the-words-language-form",
] as const;

export const processStageTaxonomy = [
  "question-encoding",
  "evidence-location",
  "evidence-interpretation",
  "option-comparison",
  "constraint-application",
  "monitoring-verification",
] as const;

export const errorCauseTaxonomy = [
  "evidence-not-found",
  "evidence-misread",
  "outside-knowledge-added",
  "scope-expanded",
  "scope-narrowed",
  "polarity-negation-missed",
  "modality-strengthened",
  "modality-weakened",
  "actor-mismatch",
  "time-mismatch",
  "condition-mismatch",
  "cause-effect-reversed",
  "example-main-point-confusion",
  "lexical-meaning-failure",
  "grammar-morphology-failure",
  "spelling-failure",
] as const;

export const distractorRelationTaxonomy = [
  "true-but-irrelevant",
  "unsupported",
  "opposite",
  "too-broad",
  "too-narrow",
  "half-true",
  "wrong-actor",
  "wrong-time",
  "wrong-condition",
  "modality-shift",
  "causal-reversal",
  "copied-phrase-wrong-relationship",
] as const;

export const behavioralContextTaxonomy = [
  "high-confidence",
  "low-confidence",
  "unusually-fast",
  "unusually-slow",
  "answer-changed",
  "no-evidence-selected",
  "repeated-error",
  "guessing-reported",
] as const;

export type Skill = (typeof skillTaxonomy)[number];
export type ProcessStage = (typeof processStageTaxonomy)[number];
export type ErrorCause = (typeof errorCauseTaxonomy)[number];
export type DistractorRelation = (typeof distractorRelationTaxonomy)[number];
export type BehavioralContext = (typeof behavioralContextTaxonomy)[number];

export type DiagnosticProbeCode =
  | "quantifier-modality"
  | "source-vs-outside"
  | "actor-match"
  | "date-vs-deadline"
  | "example-vs-main"
  | "negative-constraint";

export type InterventionPriority = "low" | "medium" | "high";

export interface ItemDiagnosticMetadata {
  taxonomyVersion: typeof MISTAKE_TAXONOMY_VERSION;
  itemId: string;
  taskType: ReadingTaskType;
  skill: Skill;
  likelyProcessStages: ProcessStage[];
  correctOptionId: string | null;
  correctEvidenceSegmentIds: string[];
  optionDistractorTags: Record<string, DistractorRelation | null>;
  optionErrorCauseHints: Partial<Record<string, ErrorCause[]>>;
  expectedSeconds: { fastBelow: number; slowAbove: number };
  preferredProbeCode: DiagnosticProbeCode | null;
}

export interface DiagnosisObservation {
  code: string;
  label: string;
  detail: string;
}

export interface RemediationTarget {
  processStage: ProcessStage;
  errorCause: ErrorCause | null;
  label: string;
}

export interface DiagnosisResult {
  observations: DiagnosisObservation[];
  behavioralContext: BehavioralContext[];
  primaryHypothesis: ErrorCause | null;
  secondaryHypotheses: ErrorCause[];
  confidence: number;
  supportingEvidence: string[];
  recommendedProbeCode: DiagnosticProbeCode | null;
  tutorReviewRequired: boolean;
  nextRemediationTarget: RemediationTarget;
  interventionPriority: InterventionPriority;
  outcome: "secure" | "unstable" | "diagnose";
  distractorRelation: DistractorRelation | null;
}

export interface DiagnosticHistory {
  priorCauseCounts: Partial<Record<ErrorCause, number>>;
  priorWrongCount: number;
}

export interface DiagnosisInput {
  metadata: ItemDiagnosticMetadata;
  selectedOptionId: string;
  selectedEvidenceSegmentIds: string[];
  confidence: "guessing" | "think-so" | "certain" | null;
  elapsedSeconds: number;
  answerChanges: number;
  history: DiagnosticHistory;
}

export interface DiagnosticProbeOption {
  id: string;
  label: string;
  interpretation: string;
}

export interface DiagnosticProbe {
  code: DiagnosticProbeCode;
  title: string;
  prompt: string;
  sourceText: string;
  options: DiagnosticProbeOption[];
  correctOptionId: string;
  estimatedSeconds: number;
  distinguishes: ErrorCause[];
}

export interface CompleteWordsMetadata {
  itemId: string;
  intendedLemma: string;
  correctWord: string;
  targetForm:
    "base" | "past-tense" | "plural" | "adjective" | "adverb" | "noun";
  correctPartOfSpeech: "verb" | "noun" | "adjective" | "adverb";
  localGrammarCue: string;
  contextMeaning: string;
  knownRelatedForms: string[];
}

export type CompleteWordsDiagnosticLayer =
  | "intended-lemma"
  | "inflection-tense"
  | "derivational-form"
  | "spelling-edit-distance"
  | "local-grammar"
  | "wider-context";

export interface CompleteWordsAnalysis {
  candidateWord: string;
  correct: boolean;
  intendedLemmaKnown: boolean;
  editDistance: number;
  primaryLayer: CompleteWordsDiagnosticLayer | null;
  primaryCause: ErrorCause | null;
  layers: Record<
    CompleteWordsDiagnosticLayer,
    "secure" | "risk" | "not-established"
  >;
  observations: DiagnosisObservation[];
  supportingEvidence: string[];
  tutorReviewRequired: boolean;
}

export type RetentionCadence = "immediate" | "D2" | "D7";
export type RetentionOutcome = "scheduled" | "secure" | "needs-work";

export interface DiagnosisRecord extends DiagnosisResult {
  id: string;
  attemptId: string;
  itemId: string;
  taskType: ReadingTaskType;
  skill: Skill;
  createdAt: string;
  probeResponseId: string | null;
  probeResolvedAt: string | null;
}

export interface ProbeResponse {
  id: string;
  diagnosisId: string;
  probeCode: DiagnosticProbeCode;
  selectedOptionId: string;
  correct: boolean;
  interpretation: string;
  submittedAt: string;
}

export interface RetentionSchedule {
  id: string;
  diagnosisId: string;
  errorCause: ErrorCause;
  itemId: string;
  cadence: RetentionCadence;
  dueDate: string;
  completedAt: string | null;
  completedAttemptId: string | null;
  outcome: RetentionOutcome;
}

export const errorCauseLabels: Record<ErrorCause, string> = {
  "evidence-not-found": "Evidence not found",
  "evidence-misread": "Evidence likely misread",
  "outside-knowledge-added": "Outside knowledge added",
  "scope-expanded": "Scope expanded",
  "scope-narrowed": "Scope narrowed",
  "polarity-negation-missed": "Polarity or negation missed",
  "modality-strengthened": "Modality strengthened",
  "modality-weakened": "Modality weakened",
  "actor-mismatch": "Actor mismatch",
  "time-mismatch": "Time mismatch",
  "condition-mismatch": "Condition mismatch",
  "cause-effect-reversed": "Cause and effect reversed",
  "example-main-point-confusion": "Example and main point confused",
  "lexical-meaning-failure": "Lexical meaning mismatch",
  "grammar-morphology-failure": "Grammar or morphology mismatch",
  "spelling-failure": "Spelling mismatch",
};

export const processStageLabels: Record<ProcessStage, string> = {
  "question-encoding": "Read the question constraint precisely",
  "evidence-location": "Locate the decisive evidence",
  "evidence-interpretation": "Interpret the evidence precisely",
  "option-comparison": "Compare each option with the text",
  "constraint-application": "Apply scope, polarity, and condition limits",
  "monitoring-verification": "Verify before committing",
};

export const distractorRelationLabels: Record<DistractorRelation, string> = {
  "true-but-irrelevant": "True, but irrelevant",
  unsupported: "Unsupported",
  opposite: "Opposite",
  "too-broad": "Too broad",
  "too-narrow": "Too narrow",
  "half-true": "Half true",
  "wrong-actor": "Wrong actor",
  "wrong-time": "Wrong time",
  "wrong-condition": "Wrong condition",
  "modality-shift": "Modality shift",
  "causal-reversal": "Causal reversal",
  "copied-phrase-wrong-relationship": "Copied phrase, wrong relationship",
};

export const mistakeTaxonomyV1 = {
  version: MISTAKE_TAXONOMY_VERSION,
  skills: skillTaxonomy,
  processStages: processStageTaxonomy,
  errorCauses: errorCauseTaxonomy,
  distractorRelations: distractorRelationTaxonomy,
  behavioralContexts: behavioralContextTaxonomy,
} as const;

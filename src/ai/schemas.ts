import { z } from "zod";
import {
  distractorRelationTaxonomy,
  errorCauseTaxonomy,
  processStageTaxonomy,
  skillTaxonomy,
} from "@/domain/mistake-intelligence";
import { readingTaskTypes } from "@/domain/models";
import {
  AI_DIAGNOSIS_INPUT_VERSION,
  AI_DIAGNOSIS_PROMPT_VERSION,
  AI_DIAGNOSIS_SCHEMA_VERSION,
  type AiDiagnosisInput,
  type AiDiagnosisSuggestion,
} from "@/domain/ai-diagnosis";

const boundedText = (maximum: number) => z.string().trim().max(maximum);

export const aiDiagnosisInputSchema = z
  .object({
    schemaVersion: z.literal(AI_DIAGNOSIS_INPUT_VERSION),
    item: z
      .object({
        taskType: z.enum(readingTaskTypes),
        skill: z.enum(skillTaxonomy),
      })
      .strict(),
    selectedOptionRelation: z.enum(distractorRelationTaxonomy).nullable(),
    evidence: z
      .object({
        designatedExcerpt: boundedText(420),
        selectedExcerpt: boundedText(420),
        overlapsDesignated: z.boolean(),
      })
      .strict(),
    response: z
      .object({
        confidence: z.enum(["guessing", "think-so", "certain"]).nullable(),
        timingBucket: z.enum(["fast", "expected", "slow"]),
        answerChanges: z.enum(["none", "one", "multiple"]),
      })
      .strict(),
    probeAnswer: z
      .object({
        probeCode: boundedText(80),
        selectedAnswer: boundedText(240),
        interpretation: boundedText(320),
        correct: z.boolean(),
      })
      .strict()
      .nullable(),
    priorPattern: z
      .object({
        primaryCause: z.enum(errorCauseTaxonomy).nullable(),
        recurrenceCount: z.number().int().min(0).max(50),
        latestRetention: z
          .enum(["scheduled", "secure", "needs-work"])
          .nullable(),
      })
      .strict()
      .nullable(),
    ruleCandidates: z
      .array(
        z
          .object({
            processStage: z.enum(processStageTaxonomy),
            errorCause: z.enum(errorCauseTaxonomy),
            confidence: z.number().min(0).max(1),
          })
          .strict(),
      )
      .min(1)
      .max(3),
    studentExplanation: boundedText(320).nullable(),
  })
  .strict() satisfies z.ZodType<AiDiagnosisInput>;

export const aiDiagnosisSuggestionSchema = z
  .object({
    primaryProcessStage: z.enum(processStageTaxonomy),
    primaryErrorCause: z.enum(errorCauseTaxonomy),
    confidence: z.number().min(0).max(1),
    secondaryCauses: z.array(z.enum(errorCauseTaxonomy)).max(2),
    distractorRelation: z.enum(distractorRelationTaxonomy).nullable(),
    supportingEvidence: z.array(boundedText(220)).min(1).max(3),
    alternativeHypotheses: z
      .array(
        z
          .object({
            processStage: z.enum(processStageTaxonomy),
            errorCause: z.enum(errorCauseTaxonomy),
            reason: boundedText(220),
          })
          .strict(),
      )
      .max(2),
    recommendedNextStep: z
      .object({
        kind: z.enum(["probe", "remediation", "abstain"]),
        prompt: boundedText(280),
      })
      .strict(),
    tutorReviewRequired: z.boolean(),
    tutorReviewReasons: z.array(boundedText(200)).max(3),
    studentFacingExplanation: boundedText(320),
  })
  .strict() satisfies z.ZodType<AiDiagnosisSuggestion>;

export const aiDiagnosisRequestSchema = z
  .object({
    requestId: z.string().uuid(),
    input: aiDiagnosisInputSchema,
  })
  .strict();

export const aiDiagnosisAuditSchema = z
  .object({
    source: z.enum(["openai", "evaluation-fixture"]),
    requestId: z.string().min(1).max(120),
    inputFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    suggestion: aiDiagnosisSuggestionSchema,
    policyReview: z
      .object({
        contradictsRule: z.boolean(),
        tutorReviewRequired: z.boolean(),
        reasons: z.array(boundedText(220)).max(4),
      })
      .strict(),
    modelVersion: boundedText(100),
    promptVersion: z.literal(AI_DIAGNOSIS_PROMPT_VERSION),
    schemaVersion: z.literal(AI_DIAGNOSIS_SCHEMA_VERSION),
    generatedAt: z.string().datetime(),
    usage: z
      .object({
        inputTokens: z.number().int().nonnegative(),
        outputTokens: z.number().int().nonnegative(),
        totalTokens: z.number().int().nonnegative(),
        estimatedCostUsd: z.number().nonnegative().nullable(),
      })
      .strict(),
  })
  .strict();

export const aiDiagnosisDecisionSchema = z.discriminatedUnion("status", [
  z
    .object({ status: z.literal("suggested"), audit: aiDiagnosisAuditSchema })
    .strict(),
  z
    .object({
      status: z.literal("fallback"),
      reason: z.enum([
        "disabled",
        "missing-key",
        "not-needed",
        "rate-limited",
        "circuit-open",
        "timeout",
        "provider-error",
        "malformed-output",
      ]),
      message: boundedText(300),
      audit: z.null(),
    })
    .strict(),
]);

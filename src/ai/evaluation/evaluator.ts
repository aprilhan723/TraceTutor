import type { AiDiagnosisSuggestion } from "@/domain/ai-diagnosis";
import { aiDiagnosisSuggestionSchema } from "@/ai/schemas";
import { reviewAiSuggestionPolicy } from "@/ai/policy";
import type { AiEvaluationFixture } from "@/ai/evaluation/fixtures";

export interface AiEvaluationSummary {
  total: number;
  valid: number;
  goldAgreement: number;
  contradictions: number;
  expectedReviewMatches: number;
  abstentions: number;
  promptInjectionCases: number;
  promptInjectionResisted: number;
  confidenceBuckets: Array<{
    bucket: "low" | "medium" | "high";
    total: number;
    agreement: number;
  }>;
}

function confidenceBucket(confidence: number): "low" | "medium" | "high" {
  return confidence < 0.65 ? "low" : confidence < 0.8 ? "medium" : "high";
}

export function evaluateAiFixtures(
  fixtures: AiEvaluationFixture[],
): AiEvaluationSummary {
  const summary: AiEvaluationSummary = {
    total: fixtures.length,
    valid: 0,
    goldAgreement: 0,
    contradictions: 0,
    expectedReviewMatches: 0,
    abstentions: 0,
    promptInjectionCases: 0,
    promptInjectionResisted: 0,
    confidenceBuckets: (["low", "medium", "high"] as const).map((bucket) => ({
      bucket,
      total: 0,
      agreement: 0,
    })),
  };

  for (const fixture of fixtures) {
    if (fixture.containsPromptInjection) summary.promptInjectionCases += 1;
    const parsed = aiDiagnosisSuggestionSchema.safeParse(fixture.modelOutput);
    if (!parsed.success) continue;
    summary.valid += 1;
    const output: AiDiagnosisSuggestion = parsed.data;
    const agrees = output.primaryErrorCause === fixture.tutorGoldPrimaryCause;
    if (agrees) summary.goldAgreement += 1;
    const bucket = summary.confidenceBuckets.find(
      (candidate) => candidate.bucket === confidenceBucket(output.confidence),
    );
    if (bucket) {
      bucket.total += 1;
      if (agrees) bucket.agreement += 1;
    }
    const policy = reviewAiSuggestionPolicy(fixture.input, output);
    if (policy.contradictsRule) summary.contradictions += 1;
    if (policy.tutorReviewRequired === fixture.expectedTutorReview) {
      summary.expectedReviewMatches += 1;
    }
    if (output.recommendedNextStep.kind === "abstain") {
      summary.abstentions += 1;
    }
    if (fixture.containsPromptInjection && agrees) {
      summary.promptInjectionResisted += 1;
    }
  }
  return summary;
}

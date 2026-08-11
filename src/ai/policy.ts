import type {
  AiDiagnosisInput,
  AiDiagnosisSuggestion,
  AiSuggestionPolicyReview,
} from "@/domain/ai-diagnosis";

export function shouldRequestAiSuggestion(input: AiDiagnosisInput) {
  return input.ruleCandidates.length > 1 || Boolean(input.studentExplanation);
}

export function reviewAiSuggestionPolicy(
  input: AiDiagnosisInput,
  suggestion: AiDiagnosisSuggestion,
): AiSuggestionPolicyReview {
  const leadingRule = input.ruleCandidates[0];
  const contradictsRule = Boolean(
    leadingRule &&
    leadingRule.errorCause !== suggestion.primaryErrorCause &&
    leadingRule.confidence >= 0.7 &&
    suggestion.confidence >= 0.7,
  );
  const reasons = [...suggestion.tutorReviewReasons];
  if (contradictsRule) {
    reasons.unshift(
      "The model and the leading deterministic rule point to different causes.",
    );
  }
  if (suggestion.confidence < 0.65) {
    reasons.push("The model confidence is below the product review threshold.");
  }
  if (suggestion.recommendedNextStep.kind === "abstain") {
    reasons.push(
      "The model recommended abstaining until a tutor reviews more evidence.",
    );
  }
  return {
    contradictsRule,
    tutorReviewRequired: true,
    reasons: [
      "TraceTutor policy requires tutor adjudication before an AI suggestion can guide the student.",
      ...new Set(reasons),
    ].slice(0, 4),
  };
}

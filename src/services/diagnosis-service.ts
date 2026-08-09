import type {
  DiagnosisInput,
  DiagnosisResult,
  DiagnosticProbe,
  ErrorCause,
  ProcessStage,
} from "@/domain/mistake-intelligence";
import {
  distractorRelationLabels,
  errorCauseLabels,
  processStageLabels,
} from "@/domain/mistake-intelligence";

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function stageForCause(cause: ErrorCause | null): ProcessStage {
  if (cause === "evidence-not-found") return "evidence-location";
  if (cause === "evidence-misread") return "evidence-interpretation";
  if (
    cause === "scope-expanded" ||
    cause === "scope-narrowed" ||
    cause === "polarity-negation-missed" ||
    cause === "modality-strengthened" ||
    cause === "modality-weakened" ||
    cause === "condition-mismatch"
  ) {
    return "constraint-application";
  }
  if (
    cause === "actor-mismatch" ||
    cause === "time-mismatch" ||
    cause === "cause-effect-reversed" ||
    cause === "example-main-point-confusion" ||
    cause === "outside-knowledge-added"
  ) {
    return "option-comparison";
  }
  return "monitoring-verification";
}

function resultForCorrectAnswer(
  confidence: DiagnosisInput["confidence"],
  evidenceSupported: boolean,
): "secure" | "unstable" {
  return confidence === "guessing" || !evidenceSupported
    ? "unstable"
    : "secure";
}

export function diagnoseAttempt(input: DiagnosisInput): DiagnosisResult {
  const {
    metadata,
    selectedOptionId,
    selectedEvidenceSegmentIds,
    confidence,
    elapsedSeconds,
    answerChanges,
    history,
  } = input;
  const correct = selectedOptionId === metadata.correctOptionId;
  const hasEvidence = selectedEvidenceSegmentIds.length > 0;
  const correctEvidenceOverlap = selectedEvidenceSegmentIds.some((segmentId) =>
    metadata.correctEvidenceSegmentIds.includes(segmentId),
  );
  const allSelectedEvidenceSupported =
    hasEvidence &&
    selectedEvidenceSegmentIds.every((segmentId) =>
      metadata.correctEvidenceSegmentIds.includes(segmentId),
    );
  const distractorRelation = correct
    ? null
    : (metadata.optionDistractorTags[selectedOptionId] ?? null);

  const behavioralContext: DiagnosisResult["behavioralContext"] = [];
  if (confidence === "certain") behavioralContext.push("high-confidence");
  if (confidence === "guessing") {
    behavioralContext.push("low-confidence", "guessing-reported");
  }
  if (elapsedSeconds < metadata.expectedSeconds.fastBelow) {
    behavioralContext.push("unusually-fast");
  }
  if (elapsedSeconds > metadata.expectedSeconds.slowAbove) {
    behavioralContext.push("unusually-slow");
  }
  if (answerChanges > 0) behavioralContext.push("answer-changed");
  if (!hasEvidence) behavioralContext.push("no-evidence-selected");
  if (history.priorWrongCount > 0) behavioralContext.push("repeated-error");

  const observations: DiagnosisResult["observations"] = [
    {
      code: correct ? "answer-correct" : "answer-incorrect",
      label: correct ? "Answer matched" : "Answer did not match",
      detail: correct
        ? "The selected answer matches the keyed answer."
        : "The selected answer does not match the keyed answer.",
    },
    {
      code: hasEvidence
        ? correctEvidenceOverlap
          ? "evidence-overlap"
          : "evidence-no-overlap"
        : "evidence-absent",
      label: hasEvidence
        ? correctEvidenceOverlap
          ? "Evidence overlaps"
          : "Evidence does not overlap"
        : "No evidence selected",
      detail: hasEvidence
        ? correctEvidenceOverlap
          ? "At least one selected segment is part of the keyed evidence."
          : "The selected segment is outside the keyed evidence."
        : "No text segment was recorded as evidence.",
    },
  ];

  if (confidence) {
    observations.push({
      code: `confidence-${confidence}`,
      label: `Confidence: ${confidence.replace("-", " ")}`,
      detail: `The student reported ${confidence.replace("-", " ")} confidence.`,
    });
  }
  if (distractorRelation) {
    observations.push({
      code: `distractor-${distractorRelation}`,
      label: distractorRelationLabels[distractorRelation],
      detail: `The chosen option is tagged “${distractorRelationLabels[distractorRelation]}” in the reviewed item metadata.`,
    });
  }
  if (behavioralContext.includes("unusually-fast")) {
    observations.push({
      code: "timing-fast",
      label: "Faster than this item’s review range",
      detail:
        "The response was unusually fast. This is context only, not a claimed cause.",
    });
  }

  if (correct) {
    const outcome = resultForCorrectAnswer(
      confidence,
      allSelectedEvidenceSupported,
    );
    const stage: ProcessStage =
      outcome === "secure"
        ? "monitoring-verification"
        : "evidence-interpretation";
    return {
      observations,
      behavioralContext: unique(behavioralContext),
      primaryHypothesis: null,
      secondaryHypotheses: [],
      confidence: outcome === "secure" ? 0.92 : 0.68,
      supportingEvidence:
        outcome === "secure"
          ? ["The answer and recorded evidence align."]
          : [
              "The answer is correct, but confidence or evidence support is not yet stable.",
            ],
      recommendedProbeCode: null,
      tutorReviewRequired: false,
      nextRemediationTarget: {
        processStage: stage,
        errorCause: null,
        label:
          outcome === "secure"
            ? "Retain this correction on a new surface"
            : "Recheck the same reasoning on a fresh item",
      },
      interventionPriority: "low",
      outcome,
      distractorRelation: null,
    };
  }

  const hintedCauses = metadata.optionErrorCauseHints[selectedOptionId] ?? [];
  let primaryHypothesis: ErrorCause;
  let secondaryHypotheses: ErrorCause[] = [];
  let diagnosisConfidence = 0.58;

  if (!hasEvidence) {
    primaryHypothesis = "evidence-not-found";
    secondaryHypotheses = hintedCauses.slice(0, 2);
    diagnosisConfidence = 0.78;
  } else if (correctEvidenceOverlap) {
    primaryHypothesis = hintedCauses[0] ?? "evidence-misread";
    const comparisonFallback: ErrorCause =
      primaryHypothesis === "evidence-misread"
        ? "scope-expanded"
        : "evidence-misread";
    secondaryHypotheses = unique([
      ...hintedCauses.slice(1),
      comparisonFallback,
    ]).slice(0, 2);
    diagnosisConfidence = distractorRelation ? 0.82 : 0.7;
  } else {
    primaryHypothesis = hintedCauses[0] ?? "outside-knowledge-added";
    secondaryHypotheses = unique([
      ...hintedCauses.slice(1),
      "evidence-not-found" as const,
    ]).slice(0, 2);
    diagnosisConfidence = distractorRelation ? 0.72 : 0.6;
  }

  const priorCount = history.priorCauseCounts[primaryHypothesis] ?? 0;
  if (priorCount > 0) diagnosisConfidence += 0.08;

  const highConfidenceWrong = confidence === "certain";
  const tutorReviewRequired = highConfidenceWrong || priorCount > 1;
  const interventionPriority = highConfidenceWrong
    ? "high"
    : priorCount > 0
      ? "medium"
      : "low";
  const processStage = stageForCause(primaryHypothesis);
  const probeCanDiscriminate =
    metadata.preferredProbeCode !== null &&
    hasEvidence &&
    (correctEvidenceOverlap || secondaryHypotheses.length > 0);

  const supportingEvidence = [
    correctEvidenceOverlap
      ? "The recorded evidence overlaps the keyed text, so evidence location is not the leading explanation."
      : hasEvidence
        ? "The recorded evidence does not overlap the keyed text."
        : "No evidence was recorded before submission.",
    distractorRelation
      ? `The selected option carries the reviewed distractor tag “${distractorRelationLabels[distractorRelation]}.”`
      : "The selected option is not supported by the item key.",
  ];
  if (highConfidenceWrong) {
    supportingEvidence.push(
      "The answer was reported as certain, which raises intervention priority without proving a mental cause.",
    );
  }

  return {
    observations,
    behavioralContext: unique(behavioralContext),
    primaryHypothesis,
    secondaryHypotheses,
    confidence: clamp(diagnosisConfidence),
    supportingEvidence,
    recommendedProbeCode: probeCanDiscriminate
      ? metadata.preferredProbeCode
      : null,
    tutorReviewRequired,
    nextRemediationTarget: {
      processStage,
      errorCause: primaryHypothesis,
      label: `${processStageLabels[processStage]} · ${errorCauseLabels[primaryHypothesis]}`,
    },
    interventionPriority,
    outcome: "diagnose",
    distractorRelation,
  };
}

export function refineDiagnosisWithProbe(
  diagnosis: DiagnosisResult,
  probe: DiagnosticProbe,
  selectedOptionId: string,
): DiagnosisResult {
  const selected = probe.options.find(
    (option) => option.id === selectedOptionId,
  );
  const correct = selectedOptionId === probe.correctOptionId;
  const supportingEvidence = [
    ...diagnosis.supportingEvidence,
    correct
      ? `The probe showed the student can distinguish this contrast: ${selected?.interpretation ?? "correct distinction"}.`
      : `The probe response preserved the contrast under review: ${selected?.interpretation ?? "the selected distinction was not supported"}.`,
  ];

  return {
    ...diagnosis,
    confidence: clamp(diagnosis.confidence + (correct ? -0.08 : 0.12)),
    supportingEvidence,
    tutorReviewRequired:
      diagnosis.tutorReviewRequired ||
      (!correct && diagnosis.confidence >= 0.7),
    interventionPriority:
      !correct && diagnosis.interventionPriority === "low"
        ? "medium"
        : diagnosis.interventionPriority,
  };
}

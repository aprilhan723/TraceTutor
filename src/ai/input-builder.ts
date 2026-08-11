import { getItemDiagnosticMetadata } from "@/data/diagnostic-metadata";
import { getPracticeItem } from "@/data/practice-content";
import {
  AI_DIAGNOSIS_INPUT_VERSION,
  type AiDiagnosisInput,
} from "@/domain/ai-diagnosis";
import type { ErrorCause, ProcessStage } from "@/domain/mistake-intelligence";
import type { TutorDiagnosisDetail } from "@/services/tutor-operations";

function processStageForCause(cause: ErrorCause): ProcessStage {
  if (cause === "evidence-not-found") return "evidence-location";
  if (cause === "evidence-misread") return "evidence-interpretation";
  if (
    [
      "scope-expanded",
      "scope-narrowed",
      "polarity-negation-missed",
      "modality-strengthened",
      "modality-weakened",
      "condition-mismatch",
    ].includes(cause)
  ) {
    return "constraint-application";
  }
  if (
    [
      "actor-mismatch",
      "time-mismatch",
      "cause-effect-reversed",
      "example-main-point-confusion",
      "outside-knowledge-added",
    ].includes(cause)
  ) {
    return "option-comparison";
  }
  return "monitoring-verification";
}

function clipExcerpt(value: string) {
  return value.trim().slice(0, 420);
}

export function buildAiDiagnosisInput(
  detail: TutorDiagnosisDetail,
): AiDiagnosisInput | null {
  const item = detail.case;
  const primary = item.machineSuggestion.primaryCause;
  if (!primary) return null;
  const practiceItem = getPracticeItem(item.attempt.itemId);
  if (!practiceItem) return null;
  const metadata = getItemDiagnosticMetadata(practiceItem);
  const causes = [primary, ...item.machineSuggestion.secondaryCauses].slice(
    0,
    3,
  );
  const selectedSegments = detail.stimulusSegments.filter(
    (segment) => segment.selected,
  );
  const designatedSegments = detail.stimulusSegments.filter(
    (segment) => segment.designated,
  );
  const latestRetention = item.retentionHistory.at(-1)?.outcome ?? null;
  const timingBucket =
    item.attempt.elapsedSeconds < metadata.expectedSeconds.fastBelow
      ? "fast"
      : item.attempt.elapsedSeconds > metadata.expectedSeconds.slowAbove
        ? "slow"
        : "expected";

  return {
    schemaVersion: AI_DIAGNOSIS_INPUT_VERSION,
    item: { taskType: item.attempt.taskType, skill: item.skill },
    selectedOptionRelation:
      metadata.optionDistractorTags[item.attempt.selectedOptionId] ?? null,
    evidence: {
      designatedExcerpt: clipExcerpt(
        designatedSegments.map((segment) => segment.text).join(" "),
      ),
      selectedExcerpt: clipExcerpt(
        selectedSegments.map((segment) => segment.text).join(" "),
      ),
      overlapsDesignated: selectedSegments.some((selected) =>
        designatedSegments.some((designated) => designated.id === selected.id),
      ),
    },
    response: {
      confidence: item.attempt.confidence,
      timingBucket,
      answerChanges:
        item.attempt.answerChanges === 0
          ? "none"
          : item.attempt.answerChanges === 1
            ? "one"
            : "multiple",
    },
    probeAnswer: item.probe
      ? {
          probeCode: item.probe.probeCode,
          selectedAnswer: item.probe.selectedAnswer,
          interpretation: item.probe.interpretation,
          correct: item.probe.correct,
        }
      : null,
    priorPattern: {
      primaryCause: primary,
      recurrenceCount: item.recurrenceCount,
      latestRetention,
    },
    ruleCandidates: causes.map((cause, index) => ({
      processStage: processStageForCause(cause),
      errorCause: cause,
      confidence:
        index === 0
          ? item.machineSuggestion.confidence
          : Math.max(
              0.35,
              item.machineSuggestion.confidence - 0.2 - index * 0.05,
            ),
    })),
    studentExplanation: null,
  };
}

import type { AnswerDraft, PracticeItem, ResultState } from "@/domain/study";

export interface ItemEvaluation {
  correct: boolean;
  evidenceCorrect: boolean | null;
  result: ResultState;
  response: string;
}

export function normalizeTypedAnswer(value: string): string {
  return value.trim().toLocaleLowerCase("en").replace(/\s+/g, "");
}

export function evaluatePracticeItem(
  item: PracticeItem,
  draft: AnswerDraft,
): ItemEvaluation {
  if (item.kind === "complete-words") {
    const response = draft.typedAnswer ?? "";
    const normalizedResponse = normalizeTypedAnswer(response);
    const correct = item.acceptedAnswers.some(
      (answer) => normalizeTypedAnswer(answer) === normalizedResponse,
    );
    return {
      correct,
      evidenceCorrect: null,
      result: correct ? "secure" : "diagnose",
      response,
    };
  }

  const response = draft.selectedOptionId ?? "";
  const correct = response === item.correctOptionId;

  if (item.kind === "transfer") {
    return {
      correct,
      evidenceCorrect: null,
      result: correct ? "secure" : "diagnose",
      response,
    };
  }

  const evidenceCorrect =
    draft.evidenceSegmentIds.length > 0 &&
    draft.evidenceSegmentIds.every((segmentId) =>
      item.correctEvidenceSegmentIds.includes(segmentId),
    );
  const result: ResultState = !correct
    ? "diagnose"
    : evidenceCorrect && draft.confidence !== "guessing"
      ? "secure"
      : "unstable";

  return { correct, evidenceCorrect, result, response };
}

export function isDraftReady(
  item: PracticeItem,
  draft: AnswerDraft | undefined,
) {
  if (!draft) {
    return false;
  }
  if (item.kind === "complete-words") {
    return Boolean(draft.typedAnswer?.trim());
  }
  if (item.kind === "transfer") {
    return Boolean(draft.selectedOptionId);
  }
  return Boolean(
    draft.selectedOptionId &&
    draft.confidence &&
    draft.evidenceSegmentIds.length > 0,
  );
}

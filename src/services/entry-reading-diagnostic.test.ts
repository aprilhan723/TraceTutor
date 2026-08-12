import { describe, expect, it } from "vitest";
import { practiceItems } from "@/data/practice-content";
import type { AnswerConfidence } from "@/domain/study";
import {
  entryReadingDiagnosticItemIds,
  evaluateEntryReadingDiagnostic,
  getEntryReadingDiagnosticItems,
} from "@/services/entry-reading-diagnostic";

function answer(
  itemId: (typeof entryReadingDiagnosticItemIds)[number],
  confidence: AnswerConfidence = "think-so",
) {
  const item = practiceItems.find((candidate) => candidate.id === itemId)!;
  return {
    itemId,
    response:
      item.kind === "complete-words"
        ? item.acceptedAnswers[0]
        : item.correctOptionId,
    confidence,
    elapsedSeconds: 35,
  };
}

describe("Reading entry diagnostic", () => {
  it("does not expose answers in its student item view", () => {
    const items = getEntryReadingDiagnosticItems();
    expect(items).toHaveLength(6);
    expect(items[0]).not.toHaveProperty("acceptedAnswers");
    expect(items[2]).not.toHaveProperty("correctOptionId");
  });

  it("prioritizes a high-confidence miss", () => {
    const responses = entryReadingDiagnosticItemIds.map((id) => answer(id));
    const daily = responses.find((row) => row.itemId === "daily-01")!;
    daily.response = "a";
    daily.confidence = "certain";
    const result = evaluateEntryReadingDiagnostic({
      responses,
      completedAt: "2026-08-12T00:00:00.000Z",
    });
    expect(result.readingPriority).toBe("daily-life");
    expect(result.recommendedSkill).toBe("purpose");
  });

  it("requires all six unique responses", () => {
    expect(() =>
      evaluateEntryReadingDiagnostic({
        responses: [answer("ctw-02")],
        completedAt: "2026-08-12T00:00:00.000Z",
      }),
    ).toThrow("Every Reading diagnostic item");
  });
});

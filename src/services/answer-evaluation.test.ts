import { describe, expect, it } from "vitest";
import { completeWordsItems } from "@/data/practice-content";
import {
  evaluatePracticeItem,
  normalizeTypedAnswer,
} from "@/services/answer-evaluation";

describe("answer normalization", () => {
  it("ignores harmless capitalization and spacing", () => {
    expect(normalizeTypedAnswer("  LoW ER  ")).toBe("lower");
  });

  it("keeps misspellings diagnostically incorrect", () => {
    const item = completeWordsItems[0];
    expect(item).toBeDefined();
    if (!item) return;

    expect(
      evaluatePracticeItem(item, {
        typedAnswer: "ER ",
        evidenceSegmentIds: [],
        savedAt: "2026-08-10T09:00:00.000Z",
      }).result,
    ).toBe("secure");
    expect(
      evaluatePracticeItem(item, {
        typedAnswer: "ar",
        evidenceSegmentIds: [],
        savedAt: "2026-08-10T09:00:00.000Z",
      }).result,
    ).toBe("diagnose");
  });
});

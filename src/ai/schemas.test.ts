import { describe, expect, it } from "vitest";
import {
  aiDiagnosisInputSchema,
  aiDiagnosisSuggestionSchema,
} from "@/ai/schemas";
import { aiEvaluationFixtures } from "@/ai/evaluation/fixtures";

describe("AI diagnosis structured schemas", () => {
  it("accepts every versioned de-identified fixture", () => {
    for (const fixture of aiEvaluationFixtures) {
      expect(aiDiagnosisInputSchema.safeParse(fixture.input).success).toBe(
        true,
      );
      expect(
        aiDiagnosisSuggestionSchema.safeParse(fixture.modelOutput).success,
      ).toBe(true);
    }
  });

  it("rejects malformed output and more than two secondary causes", () => {
    const base = aiDiagnosisSuggestionSchema.parse(
      aiEvaluationFixtures[0]?.modelOutput,
    );
    expect(
      aiDiagnosisSuggestionSchema.safeParse({
        ...base,
        secondaryCauses: [
          "scope-expanded",
          "modality-strengthened",
          "evidence-misread",
        ],
      }).success,
    ).toBe(false);
    expect(
      aiDiagnosisSuggestionSchema.safeParse({
        ...base,
        confidence: 1.2,
      }).success,
    ).toBe(false);
  });

  it("rejects identity fields at the server input boundary", () => {
    expect(
      aiDiagnosisInputSchema.safeParse({
        ...aiEvaluationFixtures[0]?.input,
        studentName: "Jamie",
      }).success,
    ).toBe(false);
  });
});

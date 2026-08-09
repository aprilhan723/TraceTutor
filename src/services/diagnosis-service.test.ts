import { describe, expect, it } from "vitest";
import { getItemDiagnosticMetadata } from "@/data/diagnostic-metadata";
import { getDiagnosticProbe } from "@/data/diagnostic-probes";
import { getPracticeItem } from "@/data/practice-content";
import type { DiagnosisInput } from "@/domain/mistake-intelligence";
import {
  diagnoseAttempt,
  refineDiagnosisWithProbe,
} from "@/services/diagnosis-service";

function inputFor(
  itemId: string,
  patch: Partial<Omit<DiagnosisInput, "metadata">>,
): DiagnosisInput {
  const item = getPracticeItem(itemId);
  if (!item) throw new Error(`Missing test item ${itemId}`);
  return {
    metadata: getItemDiagnosticMetadata(item),
    selectedOptionId: "",
    selectedEvidenceSegmentIds: [],
    confidence: "think-so",
    elapsedSeconds: 30,
    answerChanges: 0,
    history: { priorCauseCounts: {}, priorWrongCount: 0 },
    ...patch,
  };
}

describe("rule-first diagnosis", () => {
  it.each([
    {
      name: "wrong with no evidence is evidence-location risk",
      input: inputFor("academic-01", {
        selectedOptionId: "d",
        selectedEvidenceSegmentIds: [],
      }),
      primary: "evidence-not-found",
      stage: "evidence-location",
    },
    {
      name: "correct evidence plus strengthened option is not location failure",
      input: inputFor("academic-01", {
        selectedOptionId: "d",
        selectedEvidenceSegmentIds: ["moss-s3"],
        confidence: "certain",
      }),
      primary: "modality-strengthened",
      stage: "constraint-application",
    },
    {
      name: "wrong actor tag maps specifically",
      input: inputFor("daily-03", {
        selectedOptionId: "b",
        selectedEvidenceSegmentIds: ["bus-s2"],
      }),
      primary: "actor-mismatch",
      stage: "option-comparison",
    },
    {
      name: "wrong time tag maps specifically",
      input: inputFor("daily-05", {
        selectedOptionId: "d",
        selectedEvidenceSegmentIds: ["museum-s2"],
      }),
      primary: "time-mismatch",
      stage: "option-comparison",
    },
    {
      name: "too-broad tag maps to scope expansion when modality is not primary",
      input: inputFor("daily-02", {
        selectedOptionId: "d",
        selectedEvidenceSegmentIds: ["seed-s2"],
      }),
      primary: "scope-expanded",
      stage: "constraint-application",
    },
  ])("$name", ({ input, primary, stage }) => {
    const result = diagnoseAttempt(input);
    expect(result.primaryHypothesis).toBe(primary);
    expect(result.nextRemediationTarget.processStage).toBe(stage);
  });

  it("treats correct plus low confidence as Unstable", () => {
    const result = diagnoseAttempt(
      inputFor("academic-01", {
        selectedOptionId: "b",
        selectedEvidenceSegmentIds: ["moss-s3"],
        confidence: "guessing",
      }),
    );

    expect(result.outcome).toBe("unstable");
    expect(result.primaryHypothesis).toBeNull();
  });

  it("treats a correct answer with contradictory evidence as Unstable", () => {
    const result = diagnoseAttempt(
      inputFor("academic-01", {
        selectedOptionId: "b",
        selectedEvidenceSegmentIds: ["moss-s1"],
        confidence: "certain",
      }),
    );

    expect(result.outcome).toBe("unstable");
    expect(result.observations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "evidence-no-overlap" }),
      ]),
    );
  });

  it("maps a reviewed wrong-condition tag to condition mismatch", () => {
    const base = inputFor("academic-01", {
      selectedOptionId: "d",
      selectedEvidenceSegmentIds: ["moss-s3"],
    });
    const result = diagnoseAttempt({
      ...base,
      metadata: {
        ...base.metadata,
        optionDistractorTags: {
          ...base.metadata.optionDistractorTags,
          d: "wrong-condition",
        },
        optionErrorCauseHints: {
          ...base.metadata.optionErrorCauseHints,
          d: ["condition-mismatch"],
        },
      },
    });

    expect(result.primaryHypothesis).toBe("condition-mismatch");
    expect(result.nextRemediationTarget.processStage).toBe(
      "constraint-application",
    );
  });

  it("raises priority for a certain wrong answer without claiming certainty", () => {
    const result = diagnoseAttempt(
      inputFor("academic-01", {
        selectedOptionId: "d",
        selectedEvidenceSegmentIds: ["moss-s3"],
        confidence: "certain",
      }),
    );

    expect(result.interventionPriority).toBe("high");
    expect(result.tutorReviewRequired).toBe(true);
    expect(result.confidence).toBeLessThan(1);
    expect(result.supportingEvidence.join(" ")).toMatch(/without proving/i);
  });

  it("records very fast timing as context instead of a causal hypothesis", () => {
    const result = diagnoseAttempt(
      inputFor("academic-01", {
        selectedOptionId: "d",
        selectedEvidenceSegmentIds: ["moss-s3"],
        elapsedSeconds: 2,
      }),
    );

    expect(result.behavioralContext).toContain("unusually-fast");
    expect(result.primaryHypothesis).toBe("modality-strengthened");
    expect(
      result.observations.find((item) => item.code === "timing-fast")?.detail,
    ).toMatch(/context only/i);
  });

  it("uses a probe only where the reviewed contrast can discriminate causes", () => {
    const withEvidence = diagnoseAttempt(
      inputFor("academic-01", {
        selectedOptionId: "d",
        selectedEvidenceSegmentIds: ["moss-s3"],
      }),
    );
    const withoutEvidence = diagnoseAttempt(
      inputFor("academic-01", {
        selectedOptionId: "d",
        selectedEvidenceSegmentIds: [],
      }),
    );

    expect(withEvidence.recommendedProbeCode).toBe("quantifier-modality");
    expect(withoutEvidence.recommendedProbeCode).toBeNull();
  });

  it.each([
    ["same-strength", true, -1],
    ["stronger", false, 1],
  ] as const)(
    "updates its supporting trace after the %s probe response",
    (selectedOptionId, correct, direction) => {
      const diagnosis = diagnoseAttempt(
        inputFor("academic-01", {
          selectedOptionId: "d",
          selectedEvidenceSegmentIds: ["moss-s3"],
        }),
      );
      const probe = getDiagnosticProbe("quantifier-modality");
      if (!probe) throw new Error("Missing quantifier/modality probe");

      const refined = refineDiagnosisWithProbe(
        diagnosis,
        probe,
        selectedOptionId,
      );
      expect(refined.primaryHypothesis).toBe(diagnosis.primaryHypothesis);
      expect(Math.sign(refined.confidence - diagnosis.confidence)).toBe(
        direction,
      );
      expect(refined.supportingEvidence).toHaveLength(
        diagnosis.supportingEvidence.length + 1,
      );
      expect(refined.supportingEvidence.at(-1)).toMatch(
        correct ? /can distinguish/i : /preserved the contrast/i,
      );
    },
  );
});

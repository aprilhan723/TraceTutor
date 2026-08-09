import { describe, expect, it } from "vitest";
import type {
  DiagnosisRecord,
  RetentionSchedule,
} from "@/domain/mistake-intelligence";
import {
  calculateVecr7,
  createRetentionSchedules,
  selectTransferSequence,
  transitionPatternStatus,
} from "@/services/retention-engine";

const diagnosis: DiagnosisRecord = {
  id: "diagnosis-1",
  attemptId: "attempt-1",
  itemId: "academic-01",
  taskType: "academic-passage",
  skill: "purpose",
  observations: [],
  behavioralContext: ["high-confidence"],
  primaryHypothesis: "modality-strengthened",
  secondaryHypotheses: ["scope-expanded"],
  confidence: 0.82,
  supportingEvidence: ["The option strengthened the source."],
  recommendedProbeCode: "quantifier-modality",
  tutorReviewRequired: true,
  nextRemediationTarget: {
    processStage: "constraint-application",
    errorCause: "modality-strengthened",
    label: "Keep modality stable",
  },
  interventionPriority: "high",
  outcome: "diagnose",
  distractorRelation: "too-broad",
  createdAt: "2026-08-10T09:00:00.000Z",
  probeResponseId: null,
  probeResolvedAt: null,
};

describe("transfer and retention engine", () => {
  it("selects three reviewed, surface-distinct transfers", () => {
    const sequence = selectTransferSequence(
      "modality-strengthened",
      "academic-passage",
      ["academic-01"],
    );
    expect(sequence).toHaveLength(3);
    expect(new Set(sequence.map((entry) => entry.item.id)).size).toBe(3);
    expect(sequence.every((entry) => entry.item.id !== "academic-01")).toBe(
      true,
    );
    expect(new Set(sequence.map((entry) => entry.trapKey)).size).toBe(3);
  });

  it("schedules Immediate, D2, and D7 using unique items", () => {
    const schedules = createRetentionSchedules(
      diagnosis,
      "2026-08-10",
      "academic-passage",
    );
    expect(schedules.map((schedule) => schedule.cadence)).toEqual([
      "immediate",
      "D2",
      "D7",
    ]);
    expect(schedules.map((schedule) => schedule.dueDate)).toEqual([
      "2026-08-10",
      "2026-08-12",
      "2026-08-17",
    ]);
    expect(new Set(schedules.map((schedule) => schedule.itemId)).size).toBe(3);
  });

  it.each([
    ["new", "diagnose", null, 0, 1, "working"],
    ["working", "secure", "immediate", 1, 1, "improving"],
    ["improving", "secure", "D7", 1, 1, "improving"],
    ["improving", "secure", "D7", 3, 1, "resolved"],
    ["resolved", "diagnose", "D7", 3, 2, "recurring"],
    ["working", "unstable", "D2", 2, 1, "unstable"],
  ] as const)(
    "%s + %s at %s with %i surfaces and recurrence %i becomes %s",
    (currentStatus, outcome, cadence, distinct, recurrence, expected) => {
      expect(
        transitionPatternStatus({
          currentStatus,
          outcome,
          cadence,
          distinctTransferItemCount: distinct,
          recurrenceCount: recurrence,
        }),
      ).toBe(expected);
    },
  );

  it("excludes diagnoses from VECR-7 until a D7 opportunity exists", () => {
    const future: RetentionSchedule = {
      id: "d7-future",
      diagnosisId: "future",
      errorCause: "scope-expanded",
      itemId: "intel-transfer-boundary-03",
      cadence: "D7",
      dueDate: "2026-08-20",
      completedAt: null,
      completedAttemptId: null,
      outcome: "scheduled",
    };
    expect(
      calculateVecr7({ retentionSchedules: [future] }, "2026-08-10"),
    ).toEqual({ eligibleDiagnoses: 0, retainedDiagnoses: 0, rate: null });
  });

  it("uses eligible diagnoses—not attempts—as the VECR-7 denominator", () => {
    const schedules: RetentionSchedule[] = [
      {
        id: "d7-a",
        diagnosisId: "a",
        errorCause: "scope-expanded",
        itemId: "intel-transfer-boundary-03",
        cadence: "D7",
        dueDate: "2026-08-10",
        completedAt: "2026-08-10T09:00:00.000Z",
        completedAttemptId: "attempt-a",
        outcome: "secure",
      },
      {
        id: "d7-b",
        diagnosisId: "b",
        errorCause: "actor-mismatch",
        itemId: "intel-transfer-identity-03",
        cadence: "D7",
        dueDate: "2026-08-09",
        completedAt: null,
        completedAttemptId: null,
        outcome: "scheduled",
      },
      {
        id: "duplicate-a",
        diagnosisId: "a",
        errorCause: "scope-expanded",
        itemId: "intel-transfer-boundary-02",
        cadence: "D7",
        dueDate: "2026-08-10",
        completedAt: null,
        completedAttemptId: null,
        outcome: "scheduled",
      },
    ];
    expect(
      calculateVecr7({ retentionSchedules: schedules }, "2026-08-10"),
    ).toEqual({ eligibleDiagnoses: 2, retainedDiagnoses: 1, rate: 50 });
  });
});

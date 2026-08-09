import { describe, expect, it } from "vitest";
import {
  LocalDemoLearningRepository,
  MemoryKeyValueStore,
} from "@/data/local-demo-learning-repository";
import { FixedClock } from "@/lib/clock";
import { demoIds, LearningService } from "@/services/learning-service";

const onboarding = {
  targetTestDate: "2026-09-15",
  readingConfidence: "developing" as const,
  dailyStudyMinutes: 10 as const,
  reminderTime: "19:30",
  mainStruggle: "finding-evidence" as const,
};

describe("Mistake Intelligence integration", () => {
  it("gates a high-confidence miss through probe, transfer, and retention", async () => {
    const service = new LearningService(
      new LocalDemoLearningRepository(new MemoryKeyValueStore()),
      new FixedClock(),
    );
    let state = await service.saveOnboarding(demoIds.student, onboarding);
    const mission = state.activeMission;
    const review = mission?.items[0];
    if (!mission || !review) throw new Error("Expected a due review");

    await service.saveDraft(demoIds.student, mission.id, review.entryId, {
      selectedOptionId: "d",
      confidence: "certain",
      evidenceSegmentIds: ["moss-s3"],
    });
    state = await service.submitEntry(
      demoIds.student,
      mission.id,
      review.entryId,
      14,
    );

    const attempt = state.attempts.at(-1);
    const diagnosis = state.diagnoses.at(-1);
    expect(attempt?.diagnosisId).toBe(diagnosis?.id);
    expect(diagnosis?.primaryHypothesis).toBe("modality-strengthened");
    expect(diagnosis?.interventionPriority).toBe("high");
    expect(diagnosis?.recommendedProbeCode).toBe("quantifier-modality");
    expect(state.retentionSchedules).toHaveLength(3);
    expect(state.activeMission?.items[1]?.retentionCadence).toBe("immediate");

    state = await service.advanceMission(demoIds.student, mission.id);
    expect(state.activeMission?.currentIndex).toBe(0);

    if (!diagnosis) throw new Error("Expected diagnosis");
    state = await service.completeProbe(
      demoIds.student,
      diagnosis.id,
      "same-strength",
    );
    expect(state.diagnoses.at(-1)?.probeResponseId).toBeTruthy();

    state = await service.advanceMission(demoIds.student, mission.id);
    const transfer = state.activeMission?.items[1];
    expect(state.activeMission?.currentIndex).toBe(1);
    expect(transfer?.itemId).toBe("intel-transfer-boundary-01");
    if (!transfer) throw new Error("Expected immediate transfer");

    await service.saveDraft(demoIds.student, mission.id, transfer.entryId, {
      selectedOptionId: "b",
      evidenceSegmentIds: [],
    });
    state = await service.submitEntry(
      demoIds.student,
      mission.id,
      transfer.entryId,
      12,
    );

    const immediate = state.retentionSchedules.find(
      (schedule) => schedule.cadence === "immediate",
    );
    const pattern = state.patterns.find(
      (candidate) => candidate.errorCause === "modality-strengthened",
    );
    expect(immediate?.outcome).toBe("secure");
    expect(immediate?.completedAttemptId).toBeTruthy();
    expect(pattern?.status).toBe("improving");
    expect(pattern?.tutorReviewRequired).toBe(true);
  });
});

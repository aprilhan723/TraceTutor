import { describe, expect, it } from "vitest";
import {
  LocalDemoLearningRepository,
  MemoryKeyValueStore,
} from "@/data/local-demo-learning-repository";
import { FixedClock } from "@/lib/clock";
import {
  demoIds,
  demoLearningService,
  LearningService,
} from "@/services/learning-service";

const onboarding = {
  targetTestDate: "2026-09-15",
  readingConfidence: "developing" as const,
  dailyStudyMinutes: 10 as const,
  reminderTime: "19:30",
  mainStruggle: "finding-evidence" as const,
};

describe("LearningService", () => {
  it("assembles the demo student home without exposing storage details", async () => {
    const home = await demoLearningService.getStudentHome(demoIds.student);

    expect(home?.student.name).toBe("Jamie Park");
    expect(home?.mission?.estimatedMinutes).toBe(10);
    expect(home?.patterns).toHaveLength(2);
  });

  it("assembles a tutor queue connected to the demo student", async () => {
    const dashboard = await demoLearningService.getTutorDashboard(
      demoIds.tutor,
    );

    expect(dashboard?.students).toHaveLength(1);
    expect(dashboard?.interventions[0]?.studentId).toBe(demoIds.student);
  });

  it("queues offline attempt events and reconciles them locally", async () => {
    const service = new LearningService(
      new LocalDemoLearningRepository(new MemoryKeyValueStore()),
      new FixedClock(),
    );
    let state = await service.saveOnboarding(demoIds.student, onboarding);
    const mission = state.activeMission!;
    const entry = mission.items[0]!;
    await service.saveDraft(demoIds.student, mission.id, entry.entryId, {
      selectedOptionId: "b",
      confidence: "certain",
      evidenceSegmentIds: ["moss-s3"],
    });
    state = await service.submitEntry(
      demoIds.student,
      mission.id,
      entry.entryId,
      32,
      true,
    );
    expect(state.offlineEvents).toHaveLength(1);
    expect(state.offlineEvents[0]?.status).toBe("queued");

    state = await service.reconcileOfflineEvents(demoIds.student);
    expect(state.offlineEvents[0]?.status).toBe("reconciled");
    expect(state.offlineEvents[0]?.reconciledAt).not.toBeNull();
  });

  it("keeps Weekly Boss work from mutating pattern resolution data", async () => {
    const service = new LearningService(
      new LocalDemoLearningRepository(new MemoryKeyValueStore()),
      new FixedClock(),
    );
    let state = await service.saveOnboarding(demoIds.student, onboarding);
    state = await service.startWeeklyBoss(demoIds.student);
    const before = structuredClone(state.patterns);
    const mission = state.activeMission!;
    const readingEntry = mission.items.find(
      (entry) => entry.part === "thinking",
    )!;
    await service.saveDraft(demoIds.student, mission.id, readingEntry.entryId, {
      selectedOptionId: "a",
      confidence: "certain",
      evidenceSegmentIds: ["seed-s1", "moss-s1", "clay-s1"],
    });
    state = await service.submitEntry(
      demoIds.student,
      mission.id,
      readingEntry.entryId,
    );
    expect(state.patterns).toEqual(before);
    expect(state.diagnoses).toHaveLength(0);
  });
});

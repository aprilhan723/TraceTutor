import { describe, expect, it } from "vitest";
import {
  DEMO_STUDY_STORAGE_KEY,
  LEGACY_DEMO_STUDY_STORAGE_KEY,
  LocalDemoLearningRepository,
  MemoryKeyValueStore,
} from "@/data/local-demo-learning-repository";
import { createInitialStudyState } from "@/data/seed-study-state";
import { demoIds, LearningService } from "@/services/learning-service";
import { FixedClock } from "@/lib/clock";

const onboarding = {
  targetTestDate: "2026-09-15",
  readingConfidence: "developing" as const,
  dailyStudyMinutes: 10 as const,
  reminderTime: "19:30",
  mainStruggle: "finding-evidence" as const,
};

describe("LocalDemoLearningRepository", () => {
  it("persists onboarding across repository instances", async () => {
    const storage = new MemoryKeyValueStore();
    const firstService = new LearningService(
      new LocalDemoLearningRepository(storage),
      new FixedClock(),
    );
    await firstService.saveOnboarding(demoIds.student, onboarding);

    const reloadedService = new LearningService(
      new LocalDemoLearningRepository(storage),
      new FixedClock(),
    );
    const reloaded = await reloadedService.getStudyState(demoIds.student);

    expect(reloaded.onboarding?.targetTestDate).toBe("2026-09-15");
    expect(reloaded.activeMission?.items).toHaveLength(6);
  });

  it("resumes the current item and its autosaved draft", async () => {
    const storage = new MemoryKeyValueStore();
    const service = new LearningService(
      new LocalDemoLearningRepository(storage),
      new FixedClock(),
    );
    let state = await service.saveOnboarding(demoIds.student, onboarding);
    const mission = state.activeMission;
    const reviewEntry = mission?.items[0];
    expect(mission).not.toBeNull();
    expect(reviewEntry?.part).toBe("review");
    if (!mission || !reviewEntry) return;

    await service.saveDraft(demoIds.student, mission.id, reviewEntry.entryId, {
      selectedOptionId: "b",
      confidence: "think-so",
      evidenceSegmentIds: ["moss-s3"],
    });
    await service.submitEntry(demoIds.student, mission.id, reviewEntry.entryId);
    state = await service.advanceMission(demoIds.student, mission.id);
    const speedEntry = state.activeMission?.items[1];
    expect(speedEntry?.part).toBe("speed");
    if (!speedEntry) return;

    await service.saveDraft(demoIds.student, mission.id, speedEntry.entryId, {
      typedAnswer: " ER ",
    });

    const reloaded = await new LearningService(
      new LocalDemoLearningRepository(storage),
      new FixedClock(),
    ).getStudyState(demoIds.student);

    expect(reloaded.activeMission?.currentIndex).toBe(1);
    expect(
      reloaded.activeMission?.drafts[speedEntry.entryId]?.typedAnswer,
    ).toBe(" ER ");
    expect(
      reloaded.activeMission?.attemptIdsByEntry[reviewEntry.entryId],
    ).toBeDefined();
  });

  it("migrates Phase 2 browser data to version 3 without dropping progress", async () => {
    const storage = new MemoryKeyValueStore();
    const current = createInitialStudyState();
    const legacy = {
      ...current,
      version: 2,
      diagnoses: undefined,
      probeResponses: undefined,
      retentionSchedules: undefined,
      attempts: current.attempts.map((attempt) => ({
        ...attempt,
        answerChanges: undefined,
        elapsedSeconds: undefined,
        diagnosisId: undefined,
      })),
      patterns: current.patterns.map((pattern) => ({
        id: pattern.id,
        category: pattern.category,
        label: pattern.label,
        description: pattern.description,
        status: pattern.status,
        recurrenceCount: pattern.recurrenceCount,
        secureCount: pattern.secureCount,
        lastSeenAt: pattern.lastSeenAt,
      })),
    };
    storage.setItem(LEGACY_DEMO_STUDY_STORAGE_KEY, JSON.stringify(legacy));

    const migrated = await new LocalDemoLearningRepository(
      storage,
    ).getStudyState(demoIds.student);

    expect(migrated.version).toBe(3);
    expect(migrated.attempts).toHaveLength(current.attempts.length);
    expect(migrated.attempts[0]?.answerChanges).toBe(0);
    expect(migrated.patterns[0]?.recentEvidence).toEqual([]);
    expect(storage.getItem(DEMO_STUDY_STORAGE_KEY)).not.toBeNull();
  });
});

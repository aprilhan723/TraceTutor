import { describe, expect, it } from "vitest";
import { createInitialStudyState } from "@/data/seed-study-state";
import { FixedClock } from "@/lib/clock";
import { createMissionForState } from "@/services/mission-engine";
import { createDefaultStudyPlan } from "@/services/personalized-learning";
import { generateAdaptiveSessionPlan } from "@/services/session-planner";
import {
  attachAdaptiveSession,
  continueStudySession,
  pauseStudySession,
} from "@/services/study-session-service";
import { practiceItems } from "@/data/practice-content";

describe("study session resume state", () => {
  it("preserves Daily Core entries when a longer session is paused", () => {
    let state = createInitialStudyState();
    state.studyPlan = {
      ...createDefaultStudyPlan({
        nowIso: "2026-08-10T09:00:00.000Z",
        timezone: "UTC",
      }),
      onboardingCompletedAt: "2026-08-10T09:00:00.000Z",
    };
    state.activeMission = createMissionForState(state, new FixedClock());
    const coreIds = state.activeMission?.dailyCoreEntryIds ?? [];
    const plan = generateAdaptiveSessionPlan({
      requestedMinutes: 30,
      studyPlan: state.studyPlan,
      dueReviewItemIds: ["academic-01"],
      unresolvedItemIds: [],
      highConfidenceMistakeItemIds: [],
      recentItemHistory: [],
      publishedItems: practiceItems,
      todayKey: "2026-08-10",
      selectedTopic: "adaptive-mix",
      includeDueReviews: true,
      timed: false,
      dailyCoreItemIds:
        state.activeMission?.items.map((entry) => entry.itemId) ?? [],
    });
    state = attachAdaptiveSession({
      state,
      plan,
      topic: "adaptive-mix",
      includeDueReviews: true,
      timed: false,
      source: "dashboard",
      nowIso: "2026-08-10T09:01:00.000Z",
    });
    const sessionId = state.activeSessionId;
    expect(sessionId).not.toBeNull();
    if (!sessionId) return;
    const paused = pauseStudySession(
      state,
      sessionId,
      "2026-08-10T09:05:00.000Z",
    );
    expect(paused.studySessions[0]?.status).toBe("paused");
    expect(paused.activeMission?.dailyCoreEntryIds).toEqual(coreIds);
    expect(paused.activeMission?.items.length).toBeGreaterThan(coreIds.length);

    const resumed = continueStudySession(
      paused,
      sessionId,
      "2026-08-10T09:06:00.000Z",
    );
    expect(resumed.studySessions[0]?.status).toBe("active");
    expect(resumed.studySessions[0]?.pausedAt).toBeNull();
    expect(resumed.activeMission?.currentIndex).toBe(
      state.activeMission?.currentIndex,
    );
  });

  it("normalizes a legacy mission without Core IDs before adding extension work", () => {
    const state = createInitialStudyState();
    state.studyPlan = {
      ...createDefaultStudyPlan({
        nowIso: "2026-08-10T09:00:00.000Z",
        timezone: "UTC",
      }),
      onboardingCompletedAt: "2026-08-10T09:00:00.000Z",
    };
    const mission = createMissionForState(state, new FixedClock());
    if (!mission)
      throw new Error("Expected a deterministic Daily Core mission");
    state.activeMission = { ...mission, dailyCoreEntryIds: undefined };
    const legacyCoreIds = mission.items.map((entry) => entry.entryId);
    const plan = generateAdaptiveSessionPlan({
      requestedMinutes: 60,
      studyPlan: state.studyPlan,
      dueReviewItemIds: [],
      unresolvedItemIds: [],
      highConfidenceMistakeItemIds: [],
      recentItemHistory: [],
      publishedItems: practiceItems,
      todayKey: "2026-08-10",
      selectedTopic: "academic",
      includeDueReviews: true,
      timed: false,
      dailyCoreItemIds: mission.items.map((entry) => entry.itemId),
    });

    const next = attachAdaptiveSession({
      state,
      plan,
      topic: "academic",
      includeDueReviews: true,
      timed: false,
      source: "dashboard",
      nowIso: "2026-08-10T09:01:00.000Z",
    });

    expect(next.activeMission?.dailyCoreEntryIds).toEqual(legacyCoreIds);
    expect(next.studySessions[0]?.blocks[0]?.activityType).toBe("daily-core");
    expect(next.studySessions[0]?.blocks[0]?.status).toBe("active");
    expect(next.studySessions[0]?.blocks[0]?.missionEntryIds).toEqual(
      legacyCoreIds,
    );
  });
});

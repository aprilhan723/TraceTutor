import { describe, expect, it } from "vitest";
import { createInitialStudyState } from "@/data/seed-study-state";
import { FixedClock } from "@/lib/clock";
import { createMissionForState } from "@/services/mission-engine";
import {
  buildSprintRoadmap,
  buildWeeklyBossPreview,
  createLightDayMission,
  createWeeklyBossMission,
  deriveMilestones,
  getRecoveryPassAvailability,
  getStreakReason,
} from "@/services/engagement-engine";

describe("engagement engine", () => {
  function readyState() {
    return {
      ...createInitialStudyState(),
      onboarding: {
        targetTestDate: "2026-09-15",
        readingConfidence: "developing" as const,
        dailyStudyMinutes: 10 as const,
        reminderTime: "19:30",
        mainStruggle: "finding-evidence" as const,
        completedAt: "2026-08-10T09:00:00.000Z",
      },
    };
  }

  it("maps fourteen deterministic days and meaningful streak reasons", () => {
    const state = createInitialStudyState();
    const roadmap = buildSprintRoadmap(state);
    expect(roadmap).toHaveLength(14);
    expect(
      roadmap.filter((day) => day.bossDay).map((day) => day.dayNumber),
    ).toEqual([7, 14]);

    const mission = createMissionForState(readyState(), new FixedClock())!;
    expect(getStreakReason(mission)).toBe("due-review");
    expect(
      getStreakReason({
        ...mission,
        items: mission.items.filter((entry) => entry.part === "speed"),
      }),
    ).toBeNull();
  });

  it("builds a two-minute Light Day without inventing streak credit", () => {
    const mission = createMissionForState(readyState(), new FixedClock())!;
    const light = createLightDayMission(mission, "2026-08-10T09:00:00.000Z");
    expect(light.mode).toBe("light");
    expect(light.estimatedMinutes).toBe(2);
    expect(light.items).toHaveLength(1);
    expect(light.items[0]?.part).toBe("review");
    expect(getStreakReason(light)).toBe("due-review");
  });

  it("explains a deterministic mixed Boss and keeps it outside sprint-day completion", () => {
    const state = createInitialStudyState();
    const preview = buildWeeklyBossPreview(state);
    const boss = createWeeklyBossMission(state, new FixedClock());
    expect(preview.theme).toBe("The Half-Truth Hydra");
    expect(preview.itemReasons.length).toBeGreaterThanOrEqual(3);
    expect(preview.itemReasons.every((entry) => entry.reason.length > 20)).toBe(
      true,
    );
    expect(boss.mode).toBe("weekly-boss");
    expect(boss.dayNumber).toBe(0);
  });

  it("grants one Recovery Pass per period and derives evidence-based milestones", () => {
    const state = createInitialStudyState();
    expect(getRecoveryPassAvailability(state)).toMatchObject({
      period: 1,
      available: true,
    });
    const used = {
      ...state,
      recoveryPassUses: [
        {
          period: 1 as const,
          protectedDate: "2026-08-09",
          usedAt: "2026-08-10T09:00:00.000Z",
        },
      ],
    };
    expect(getRecoveryPassAvailability(used).available).toBe(false);
    const milestones = deriveMilestones(state, 1);
    expect(
      milestones.find((entry) => entry.id === "first-verified-correction")
        ?.achieved,
    ).toBe(true);
    expect(
      milestones.find((entry) => entry.id === "first-d7-pass")?.achieved,
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { createInitialStudyState } from "@/data/seed-study-state";
import { FixedClock } from "@/lib/clock";
import { createMissionForState } from "@/services/mission-engine";

describe("14-day mission selection", () => {
  it("puts a due review before the normal ten-minute practice mix", () => {
    const state = createInitialStudyState();
    state.onboarding = {
      targetTestDate: "2026-09-15",
      readingConfidence: "developing",
      dailyStudyMinutes: 10,
      reminderTime: "19:30",
      mainStruggle: "finding-evidence",
      completedAt: "2026-08-10T09:00:00.000Z",
    };

    const mission = createMissionForState(state, new FixedClock());

    expect(mission?.dayNumber).toBe(1);
    expect(mission?.items[0]?.part).toBe("review");
    expect(mission?.items.filter((item) => item.part === "speed")).toHaveLength(
      3,
    );
    expect(
      mission?.items.filter((item) => item.part === "thinking"),
    ).toHaveLength(1);
    expect(
      mission?.items.filter((item) => item.part === "transfer"),
    ).toHaveLength(1);
    expect(mission?.items).toHaveLength(6);
  });
});

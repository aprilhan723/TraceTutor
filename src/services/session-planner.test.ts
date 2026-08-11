import { describe, expect, it } from "vitest";
import { practiceItems } from "@/data/practice-content";
import { createDefaultStudyPlan } from "@/services/personalized-learning";
import { generateAdaptiveSessionPlan } from "@/services/session-planner";

const studyPlan = {
  ...createDefaultStudyPlan({
    nowIso: "2026-08-11T09:00:00.000Z",
    timezone: "UTC",
  }),
  onboardingCompletedAt: "2026-08-11T09:00:00.000Z",
};

function plan(minutes: number, overrides = {}) {
  return generateAdaptiveSessionPlan({
    requestedMinutes: minutes,
    studyPlan,
    dueReviewItemIds: ["academic-01"],
    unresolvedItemIds: ["daily-01"],
    highConfidenceMistakeItemIds: ["daily-02"],
    recentItemHistory: [],
    publishedItems: practiceItems,
    todayKey: "2026-08-11",
    selectedTopic: "adaptive-mix",
    includeDueReviews: true,
    timed: false,
    dailyCoreItemIds: ["academic-01", "ctw-01", "ctw-02", "ctw-03", "daily-01"],
    ...overrides,
  });
}

describe("adaptive long-session planner", () => {
  it.each([15, 30, 60, 90, 120])(
    "builds a bounded %i-minute plan with Daily Core first",
    (minutes) => {
      const result = plan(minutes);
      expect(result.requestedMinutes).toBe(minutes);
      expect(result.blocks[0]?.activityType).toBe("daily-core");
      expect(result.availableMinutes).toBeLessThanOrEqual(minutes);
      expect(
        new Set(result.blocks.flatMap((block) => block.itemIds)).size,
      ).toBe(result.blocks.flatMap((block) => block.itemIds).length);
    },
  );

  it("adds breaks to deep plans and honors a selected topic", () => {
    const result = plan(90, { selectedTopic: "academic" });
    expect(result.blocks.some((block) => block.activityType === "break")).toBe(
      true,
    );
    const extensionItems = result.blocks
      .slice(1)
      .flatMap((block) => block.itemIds);
    expect(
      extensionItems.every(
        (id) =>
          practiceItems.find((item) => item.id === id)?.taskType ===
            "academic-passage" ||
          practiceItems.find((item) => item.id === id)?.kind === "transfer",
      ),
    ).toBe(true);
  });

  it("supports a custom session length without exceeding the request", () => {
    const result = plan(17);
    expect(result.requestedMinutes).toBe(17);
    expect(result.availableMinutes).toBeLessThanOrEqual(17);
    expect(result.sessionType).toBe("focused");
    expect(result.blocks[0]?.activityType).toBe("daily-core");
  });

  it("does not repeat unseen items used in the previous seven days", () => {
    const result = plan(30, {
      recentItemHistory: [{ itemId: "ctw-04", localDate: "2026-08-10" }],
    });
    expect(result.blocks.flatMap((block) => block.itemIds)).not.toContain(
      "ctw-04",
    );
  });

  it("reduces an impossible plan honestly without duplicate filler", () => {
    const result = generateAdaptiveSessionPlan({
      requestedMinutes: 120,
      studyPlan,
      dueReviewItemIds: [],
      unresolvedItemIds: [],
      highConfidenceMistakeItemIds: [],
      recentItemHistory: [],
      publishedItems: practiceItems.slice(0, 3),
      todayKey: "2026-08-11",
      selectedTopic: "adaptive-mix",
      includeDueReviews: false,
      timed: false,
      dailyCoreItemIds: ["ctw-01"],
    });
    expect(result.contentShortage).toBe(true);
    expect(result.shortageMessage).toContain("did not duplicate");
    const ids = result.blocks.flatMap((block) => block.itemIds);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

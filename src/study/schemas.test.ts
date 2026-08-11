import { describe, expect, it } from "vitest";
import {
  studyActivityWriteSchema,
  studyPlanWriteSchema,
} from "@/study/schemas";

describe("Phase 9 server write schemas", () => {
  it("accepts half-step scores and a complete flexible study plan", () => {
    expect(
      studyPlanWriteSchema.safeParse({
        learningStyle: "deep-focus",
        defaultDailyMinutes: 60,
        weeklyGoalMinutes: 240,
        studyDaysPerWeek: 4,
        currentReadingLevel: 3.5,
        targetReadingScore: 5,
        targetTestDate: "2026-10-20",
        readingPriority: "academic",
        preferredStudyTime: "19:30",
        timezone: "Asia/Seoul",
        onboardingCompletedAt: "2026-08-11T09:00:00.000Z",
      }).success,
    ).toBe(true);
  });

  it("rejects malformed active-time batches", () => {
    expect(
      studyActivityWriteSchema.safeParse({
        sessionId: "28000000-0000-4000-8000-000000000001",
        clientEventId: "28100000-0000-4000-8000-000000000001",
        localDate: "2026-08-11",
        activeSeconds: 91,
        questionsAnswered: 1,
        correctAnswers: 2,
        reviewsCompleted: 0,
        transferItemsCompleted: 0,
        diagnosticsCompleted: 0,
      }).success,
    ).toBe(false);
  });

  it("rejects invalid timezones and past target dates", () => {
    const result = studyPlanWriteSchema.safeParse({
      learningStyle: "daily-rhythm",
      defaultDailyMinutes: 15,
      weeklyGoalMinutes: 75,
      studyDaysPerWeek: 5,
      currentReadingLevel: null,
      targetReadingScore: null,
      targetTestDate: "2026-01-01",
      readingPriority: "balanced",
      preferredStudyTime: null,
      timezone: "Moon/Sea_of_Tranquility",
      onboardingCompletedAt: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["timezone", "targetTestDate"]),
      );
    }
  });
});

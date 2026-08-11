import { describe, expect, it } from "vitest";
import { createEmptyStudyState } from "@/data/seed-study-state";
import {
  calculateCorrectionStreak,
  calculateWeeklyGoalMinutes,
  createDefaultStudyPlan,
  markDailyCoreComplete,
  toLocalDateKey,
} from "@/services/personalized-learning";

describe("personalized learning foundations", () => {
  it("calculates weekly goals for Daily Rhythm and Deep Focus", () => {
    expect(calculateWeeklyGoalMinutes(15, 5)).toBe(75);
    expect(calculateWeeklyGoalMinutes(60, 4)).toBe(240);
  });

  it("uses learner-local calendar dates", () => {
    const instant = new Date("2026-08-11T16:30:00.000Z");
    expect(toLocalDateKey(instant, "Asia/Seoul")).toBe("2026-08-12");
    expect(toLocalDateKey(instant, "America/Los_Angeles")).toBe("2026-08-11");
  });

  it("keeps the local date stable across the New York DST fallback", () => {
    expect(
      toLocalDateKey(new Date("2026-11-02T04:30:00.000Z"), "America/New_York"),
    ).toBe("2026-11-01");
    expect(
      toLocalDateKey(new Date("2026-11-02T05:30:00.000Z"), "America/New_York"),
    ).toBe("2026-11-02");
  });

  it("increments once per eligible day and honors a Recovery Pass gap", () => {
    const entries = ["2026-08-08", "2026-08-10", "2026-08-11"].map(
      (localDate) => ({
        learnerId: "student",
        localDate,
        activeSeconds: 0,
        questionsAnswered: 1,
        correctAnswers: 1,
        reviewsCompleted: 0,
        transferItemsCompleted: 0,
        diagnosticsCompleted: 0,
        dailyCoreCompleted: true,
        streakEligible: true,
        goalMinutes: 10,
        createdAt: `${localDate}T09:00:00.000Z`,
        updatedAt: `${localDate}T09:00:00.000Z`,
      }),
    );
    expect(
      calculateCorrectionStreak(entries, "2026-08-11", ["2026-08-09"]),
    ).toMatchObject({ current: 3, longest: 3 });
  });

  it("resets the current streak after an unprotected missed day", () => {
    const entries = ["2026-08-08", "2026-08-10"].map((localDate) => ({
      learnerId: "student",
      localDate,
      activeSeconds: 0,
      questionsAnswered: 1,
      correctAnswers: 1,
      reviewsCompleted: 0,
      transferItemsCompleted: 0,
      diagnosticsCompleted: 0,
      dailyCoreCompleted: true,
      streakEligible: true,
      goalMinutes: 10,
      createdAt: `${localDate}T09:00:00.000Z`,
      updatedAt: `${localDate}T09:00:00.000Z`,
    }));
    expect(calculateCorrectionStreak(entries, "2026-08-10")).toMatchObject({
      current: 1,
      longest: 1,
    });
  });

  it("does not double-count a repeated Daily Core completion", () => {
    let state = createEmptyStudyState("student", "2026-08-11T09:00:00.000Z");
    state.studyPlan = createDefaultStudyPlan({
      nowIso: "2026-08-11T09:00:00.000Z",
      timezone: "UTC",
    });
    state = markDailyCoreComplete({
      state,
      localDate: "2026-08-11",
      nowIso: "2026-08-11T09:10:00.000Z",
    });
    const repeated = markDailyCoreComplete({
      state,
      localDate: "2026-08-11",
      nowIso: "2026-08-11T09:11:00.000Z",
    });
    expect(repeated.streakStats.current).toBe(1);
    expect(repeated.dailyProgress).toHaveLength(1);
  });
});

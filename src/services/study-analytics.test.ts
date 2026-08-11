import { describe, expect, it } from "vitest";
import { createEmptyStudyState } from "@/data/seed-study-state";
import { calculateProgressMetrics } from "@/services/study-analytics";

describe("study analytics honesty", () => {
  it("keeps trend and retention metrics empty until supported observations exist", () => {
    const metrics = calculateProgressMetrics(
      createEmptyStudyState("student", "2026-08-11T09:00:00.000Z"),
    );

    expect(metrics.recentAccuracy).toBeNull();
    expect(metrics.sevenDayAccuracy).toBeNull();
    expect(metrics.thirtyDayAccuracy).toBeNull();
    expect(metrics.immediateTransferRate).toBeNull();
    expect(metrics.d2RetentionRate).toBeNull();
    expect(metrics.d7RetentionRate).toBeNull();
    expect(metrics.hasAccuracyTrend).toBe(false);
  });
});

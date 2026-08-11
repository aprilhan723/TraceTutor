import { describe, expect, it } from "vitest";
import {
  activeMinutesFromSeconds,
  shouldAccumulateActiveTime,
} from "@/services/active-time";

describe("active study time", () => {
  const base = {
    sessionStatus: "active" as const,
    documentVisible: true,
    nowMs: 100_000,
    lastInteractionMs: 20_000,
  };

  it("counts only active, visible, recently interacted sessions", () => {
    expect(shouldAccumulateActiveTime(base)).toBe(true);
    expect(
      shouldAccumulateActiveTime({ ...base, sessionStatus: "paused" }),
    ).toBe(false);
    expect(
      shouldAccumulateActiveTime({ ...base, documentVisible: false }),
    ).toBe(false);
    expect(
      shouldAccumulateActiveTime({ ...base, lastInteractionMs: 9_000 }),
    ).toBe(false);
  });

  it("does not round partial active minutes up", () => {
    expect(activeMinutesFromSeconds(119)).toBe(1);
  });
});

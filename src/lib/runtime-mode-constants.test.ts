import { describe, expect, it } from "vitest";
import {
  isApplicationPath,
  requiresPrivateAccountCache,
} from "@/lib/runtime-mode-constants";

describe("runtime cache boundary", () => {
  it("keeps authenticated account surfaces private", () => {
    expect(requiresPrivateAccountCache("/student/today", false)).toBe(true);
    expect(requiresPrivateAccountCache("/tutor/dashboard", false)).toBe(true);
    expect(requiresPrivateAccountCache("/auth/sign-in", false)).toBe(true);
  });

  it("preserves cacheable local demo pages after an explicit demo entry", () => {
    expect(requiresPrivateAccountCache("/student/today", true)).toBe(false);
    expect(requiresPrivateAccountCache("/tutor/dashboard", true)).toBe(false);
    expect(requiresPrivateAccountCache("/auth/sign-in", true)).toBe(true);
    expect(isApplicationPath("/student/practice/mission-1")).toBe(true);
    expect(isApplicationPath("/privacy")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { decideRouteAccess } from "@/auth/access";

describe("route access decisions", () => {
  it("preserves Demo Mode when Supabase is absent", () => {
    expect(
      decideRouteAccess({
        configured: false,
        userId: null,
        profile: null,
        requiredRole: "student",
      }),
    ).toEqual({ outcome: "demo" });
  });

  it("requires a verified identity and completed profile", () => {
    expect(
      decideRouteAccess({
        configured: true,
        userId: null,
        profile: null,
        requiredRole: "tutor",
      }).outcome,
    ).toBe("sign-in");
    expect(
      decideRouteAccess({
        configured: true,
        userId: "user-1",
        profile: null,
        requiredRole: "tutor",
      }).outcome,
    ).toBe("complete-profile");
  });

  it("does not accept a self-asserted wrong role", () => {
    expect(
      decideRouteAccess({
        configured: true,
        userId: "user-1",
        profile: { role: "student", displayName: "Jamie" },
        requiredRole: "tutor",
      }),
    ).toEqual({ outcome: "wrong-role", role: "student" });
  });
});

import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/account/route";

describe("account mode entry", () => {
  it("clears the explicit demo selection before continuing authentication", () => {
    const response = GET(
      new NextRequest("https://tracetutor.example/account", {
        headers: { cookie: "tt_demo_mode=1" },
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://tracetutor.example/auth/continue",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("set-cookie")).toContain("tt_demo_mode=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(response.headers.get("set-cookie")).toContain("Path=/");
  });
});

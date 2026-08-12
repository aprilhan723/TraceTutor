import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicAppUrl } from "@/lib/public-url";

describe("getPublicAppUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses localhost when no public origin is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    expect(getPublicAppUrl().toString()).toBe("http://localhost:3000/");
  });

  it("uses a valid public HTTP origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://project-qiel2.vercel.app");

    expect(getPublicAppUrl().origin).toBe("https://project-qiel2.vercel.app");
  });

  it("rejects malformed and non-HTTP values", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "javascript:alert(1)");

    expect(getPublicAppUrl().toString()).toBe("http://localhost:3000/");
  });
});

import { describe, expect, it } from "vitest";
import { LocalDemoLearningRepository } from "@/data/local-demo-learning-repository";
import { createLearningRepository } from "@/data/repository-factory";

describe("repository factory", () => {
  it("uses the independent local repository without public Supabase configuration", () => {
    expect(
      createLearningRepository({
        supabaseConfigured: false,
        demoRequested: false,
      }),
    ).toBeInstanceOf(LocalDemoLearningRepository);
  });

  it("keeps the local sales demo when explicitly requested", () => {
    expect(
      createLearningRepository({
        supabaseConfigured: true,
        demoRequested: true,
      }),
    ).toBeInstanceOf(LocalDemoLearningRepository);
  });

  it("requires authenticated context before selecting Supabase", () => {
    expect(() =>
      createLearningRepository({
        supabaseConfigured: true,
        demoRequested: false,
      }),
    ).toThrow("Authenticated Supabase repository context is required");
  });
});

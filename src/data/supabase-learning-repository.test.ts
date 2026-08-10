import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { SupabaseLearningRepository } from "@/data/supabase-learning-repository";
import type { Database } from "@/lib/supabase/database.types";
import { createEmptyStudyState } from "@/data/seed-study-state";

const inertClient = {} as SupabaseClient<Database>;

describe("Supabase learning repository command boundary", () => {
  it("keeps the authenticated account identifier at the adapter boundary", () => {
    const repository = new SupabaseLearningRepository(inertClient, "account-1");
    expect(repository.activeAccountId).toBe("account-1");
  });

  it("rejects unvalidated aggregate writes in favor of secure relational commands", async () => {
    const repository = new SupabaseLearningRepository(inertClient, "student-1");
    await expect(
      repository.saveStudyState(createEmptyStudyState("student-1")),
    ).rejects.toThrow("validated assignment response or onboarding command");
  });
});

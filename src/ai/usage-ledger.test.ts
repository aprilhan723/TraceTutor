import { describe, expect, it } from "vitest";
import { AiUsageLedger } from "@/ai/usage-ledger";

describe("AiUsageLedger", () => {
  it("tracks versioned token and cost counters without guessing unknown prices", () => {
    const ledger = new AiUsageLedger();
    const priced = ledger.recordSuccess(
      "org-1",
      { inputTokens: 1_000, outputTokens: 500, totalTokens: 1_500 },
      "gpt-5.6-luna",
    );
    expect(priced.estimatedCostUsd).toBe(0.0008);
    expect(ledger.getOrganizationTotals("org-1")).toMatchObject({
      requests: 1,
      inputTokens: 1_000,
      outputTokens: 500,
      totalTokens: 1_500,
      estimatedCostUsd: 0.0008,
    });

    expect(
      ledger.recordSuccess(
        "org-2",
        { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
        "unpriced-model",
      ).estimatedCostUsd,
    ).toBeNull();
  });
});

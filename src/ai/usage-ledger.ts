import type { AiUsageSummary } from "@/domain/ai-diagnosis";

export interface AiUsageTotals extends AiUsageSummary {
  requests: number;
  failures: number;
}

const EMPTY_TOTALS: AiUsageTotals = {
  requests: 0,
  failures: 0,
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  estimatedCostUsd: 0,
};

const MODEL_PRICING_PER_MILLION: Record<
  string,
  { input: number; output: number }
> = {
  "gpt-5.6-luna": { input: 0.2, output: 1.2 },
  "gpt-5.6-terra": { input: 2, output: 12 },
  "gpt-5.6-sol": { input: 5, output: 30 },
};

export function calculateEstimatedCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
) {
  const pricing = MODEL_PRICING_PER_MILLION[model];
  if (!pricing) return null;
  return Number(
    (
      (inputTokens * pricing.input + outputTokens * pricing.output) /
      1_000_000
    ).toFixed(8),
  );
}

export class AiUsageLedger {
  private readonly totalsByOrganization = new Map<string, AiUsageTotals>();

  recordSuccess(
    organizationId: string,
    usage: Omit<AiUsageSummary, "estimatedCostUsd">,
    model: string,
  ) {
    const current = this.getOrganizationTotals(organizationId);
    const requestCost = calculateEstimatedCost(
      model,
      usage.inputTokens,
      usage.outputTokens,
    );
    const nextCost =
      current.estimatedCostUsd === null || requestCost === null
        ? null
        : Number((current.estimatedCostUsd + requestCost).toFixed(8));
    this.totalsByOrganization.set(organizationId, {
      requests: current.requests + 1,
      failures: current.failures,
      inputTokens: current.inputTokens + usage.inputTokens,
      outputTokens: current.outputTokens + usage.outputTokens,
      totalTokens: current.totalTokens + usage.totalTokens,
      estimatedCostUsd: nextCost,
    });
    return { ...usage, estimatedCostUsd: requestCost };
  }

  recordFailure(organizationId: string) {
    const current = this.getOrganizationTotals(organizationId);
    this.totalsByOrganization.set(organizationId, {
      ...current,
      failures: current.failures + 1,
    });
  }

  getOrganizationTotals(organizationId: string): AiUsageTotals {
    return {
      ...(this.totalsByOrganization.get(organizationId) ?? EMPTY_TOTALS),
    };
  }
}

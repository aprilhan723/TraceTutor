import { describe, expect, it, vi } from "vitest";
import {
  AiDiagnosisService,
  type AiDiagnosisProvider,
  type AiProviderResult,
} from "@/ai/diagnosis-service";
import { aiDiagnosisSuggestionSchema } from "@/ai/schemas";
import { aiEvaluationFixtures } from "@/ai/evaluation/fixtures";
import { AiRateLimiter } from "@/ai/safety-controls";

const actor = { userId: "tutor-1", organizationId: "org-1" };
const fixture = aiEvaluationFixtures[0];
if (!fixture) throw new Error("Expected an AI evaluation fixture.");
const output = aiDiagnosisSuggestionSchema.parse(fixture.modelOutput);

function providerResult(): AiProviderResult {
  return {
    output,
    modelVersion: "mock-model-v1",
    usage: { inputTokens: 100, outputTokens: 40, totalTokens: 140 },
  };
}

describe("AiDiagnosisService", () => {
  it("keeps the deterministic fallback active when live AI is disabled", async () => {
    const provider: AiDiagnosisProvider = { suggest: vi.fn() };
    const service = new AiDiagnosisService(provider, {
      availability: "disabled",
      model: "mock-model-v1",
    });
    const result = await service.suggest({
      requestId: "disabled-1",
      actor,
      input: fixture.input,
    });
    expect(result).toMatchObject({ status: "fallback", reason: "disabled" });
    expect(provider.suggest).not.toHaveBeenCalled();
  });

  it("falls back safely when no API credential is available", async () => {
    const service = new AiDiagnosisService(null, {
      availability: "missing-key",
      model: "mock-model-v1",
    });
    await expect(
      service.suggest({ requestId: "missing-1", actor, input: fixture.input }),
    ).resolves.toMatchObject({ status: "fallback", reason: "missing-key" });
  });

  it("does not call a model when one rule hypothesis is sufficient", async () => {
    const provider: AiDiagnosisProvider = { suggest: vi.fn() };
    const service = new AiDiagnosisService(provider, {
      availability: "ready",
      model: "mock-model-v1",
    });
    const result = await service.suggest({
      requestId: "not-needed-1",
      actor,
      input: {
        ...fixture.input,
        ruleCandidates: fixture.input.ruleCandidates.slice(0, 1),
      },
    });
    expect(result).toMatchObject({
      status: "fallback",
      reason: "not-needed",
    });
    expect(provider.suggest).not.toHaveBeenCalled();
  });

  it("validates, audits, meters, and idempotently returns a mock suggestion", async () => {
    const suggest = vi.fn(async () => providerResult());
    const service = new AiDiagnosisService(
      { suggest },
      {
        availability: "ready",
        model: "mock-model-v1",
        now: () => Date.parse("2026-08-11T00:00:00.000Z"),
      },
    );
    const request = { requestId: "same-request", actor, input: fixture.input };
    const first = await service.suggest(request);
    const second = await service.suggest(request);
    expect(first).toEqual(second);
    expect(suggest).toHaveBeenCalledTimes(1);
    expect(first).toMatchObject({
      status: "suggested",
      audit: {
        source: "openai",
        modelVersion: "mock-model-v1",
        usage: { inputTokens: 100, outputTokens: 40, totalTokens: 140 },
        policyReview: { tutorReviewRequired: true },
      },
    });
    expect(service.getOrganizationUsage("org-1")).toMatchObject({
      requests: 1,
      totalTokens: 140,
    });
  });

  it("discards malformed structured output after one bounded retry", async () => {
    const suggest = vi.fn(async () => ({
      ...providerResult(),
      output: { confidence: 0.9 },
    }));
    const service = new AiDiagnosisService(
      { suggest },
      {
        availability: "ready",
        model: "mock-model-v1",
        retries: 1,
      },
    );
    const result = await service.suggest({
      requestId: "malformed-1",
      actor,
      input: fixture.input,
    });
    expect(result).toMatchObject({
      status: "fallback",
      reason: "malformed-output",
    });
    expect(suggest).toHaveBeenCalledTimes(2);
  });

  it("opens the circuit after repeated provider failures", async () => {
    const suggest = vi.fn(async (): Promise<AiProviderResult> => {
      throw new Error("provider unavailable");
    });
    const service = new AiDiagnosisService(
      { suggest },
      {
        availability: "ready",
        model: "mock-model-v1",
        retries: 0,
        now: () => 100,
      },
    );
    for (const requestId of ["failure-1", "failure-2", "failure-3"]) {
      await expect(
        service.suggest({ requestId, actor, input: fixture.input }),
      ).resolves.toMatchObject({
        status: "fallback",
        reason: "provider-error",
      });
    }
    await expect(
      service.suggest({
        requestId: "circuit-open",
        actor,
        input: fixture.input,
      }),
    ).resolves.toMatchObject({ status: "fallback", reason: "circuit-open" });
    expect(suggest).toHaveBeenCalledTimes(3);
  });

  it("enforces a per-user rate limit before another model call", async () => {
    const suggest = vi.fn(async () => providerResult());
    const service = new AiDiagnosisService(
      { suggest },
      {
        availability: "ready",
        model: "mock-model-v1",
        rateLimiter: new AiRateLimiter(1, 10),
      },
    );
    await service.suggest({ requestId: "rate-1", actor, input: fixture.input });
    await expect(
      service.suggest({ requestId: "rate-2", actor, input: fixture.input }),
    ).resolves.toMatchObject({ status: "fallback", reason: "rate-limited" });
    expect(suggest).toHaveBeenCalledTimes(1);
  });

  it("enforces the organization limit across different tutors", async () => {
    const suggest = vi.fn(async () => providerResult());
    const service = new AiDiagnosisService(
      { suggest },
      {
        availability: "ready",
        model: "mock-model-v1",
        rateLimiter: new AiRateLimiter(10, 1),
      },
    );
    await service.suggest({
      requestId: "org-rate-1",
      actor,
      input: fixture.input,
    });
    await expect(
      service.suggest({
        requestId: "org-rate-2",
        actor: { userId: "tutor-2", organizationId: actor.organizationId },
        input: fixture.input,
      }),
    ).resolves.toMatchObject({ status: "fallback", reason: "rate-limited" });
    expect(suggest).toHaveBeenCalledTimes(1);
  });

  it("times out a hanging provider and returns the rule fallback", async () => {
    const provider: AiDiagnosisProvider = {
      suggest: (_input, options) =>
        new Promise<AiProviderResult>((_resolve, reject) => {
          options.signal.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    };
    const service = new AiDiagnosisService(provider, {
      availability: "ready",
      model: "mock-model-v1",
      retries: 0,
      timeoutMs: 5,
    });
    await expect(
      service.suggest({ requestId: "timeout-1", actor, input: fixture.input }),
    ).resolves.toMatchObject({ status: "fallback", reason: "timeout" });
  });
});

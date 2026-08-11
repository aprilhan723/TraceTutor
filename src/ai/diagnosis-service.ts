import { createHash } from "node:crypto";
import type {
  AiActorContext,
  AiDiagnosisAuditSnapshot,
  AiDiagnosisDecision,
  AiDiagnosisInput,
  AiDiagnosisSuggestion,
} from "@/domain/ai-diagnosis";
import {
  AI_DIAGNOSIS_PROMPT_VERSION,
  AI_DIAGNOSIS_SCHEMA_VERSION,
} from "@/domain/ai-diagnosis";
import { aiDiagnosisSuggestionSchema } from "@/ai/schemas";
import {
  reviewAiSuggestionPolicy,
  shouldRequestAiSuggestion,
} from "@/ai/policy";
import { AiCircuitBreaker, AiRateLimiter } from "@/ai/safety-controls";
import { AiUsageLedger } from "@/ai/usage-ledger";

export interface AiProviderResult {
  output: unknown;
  modelVersion: string;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
}

export interface AiDiagnosisProvider {
  suggest(
    input: AiDiagnosisInput,
    options: { signal: AbortSignal; safetyIdentifier: string },
  ): Promise<AiProviderResult>;
}

export interface RedactedAiLogEvent {
  status: "suggested" | "fallback" | "rate-limited" | "circuit-open";
  model: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  errorCategory?: string;
}

export type RedactedAiLogger = (event: RedactedAiLogEvent) => void;

export interface AiDiagnosisServiceOptions {
  availability: "ready" | "disabled" | "missing-key";
  model: string;
  timeoutMs?: number;
  retries?: number;
  now?: () => number;
  logger?: RedactedAiLogger;
  rateLimiter?: AiRateLimiter;
  circuitBreaker?: AiCircuitBreaker;
  usageLedger?: AiUsageLedger;
}

function fallback(
  reason: Extract<AiDiagnosisDecision, { status: "fallback" }>["reason"],
  message: string,
): AiDiagnosisDecision {
  return { status: "fallback", reason, message, audit: null };
}

function fingerprint(input: AiDiagnosisInput) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function safetyIdentifier(actor: AiActorContext) {
  return `tt_${createHash("sha256")
    .update(`${actor.organizationId}:${actor.userId}`)
    .digest("hex")
    .slice(0, 32)}`;
}

export class AiDiagnosisService {
  private readonly rateLimiter: AiRateLimiter;
  private readonly circuitBreaker: AiCircuitBreaker;
  private readonly usageLedger: AiUsageLedger;
  private readonly now: () => number;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly logger: RedactedAiLogger;
  private readonly completed = new Map<
    string,
    { decision: AiDiagnosisDecision; expiresAt: number }
  >();
  private readonly inFlight = new Map<string, Promise<AiDiagnosisDecision>>();

  constructor(
    private readonly provider: AiDiagnosisProvider | null,
    private readonly options: AiDiagnosisServiceOptions,
  ) {
    this.rateLimiter = options.rateLimiter ?? new AiRateLimiter();
    this.circuitBreaker = options.circuitBreaker ?? new AiCircuitBreaker();
    this.usageLedger = options.usageLedger ?? new AiUsageLedger();
    this.now = options.now ?? Date.now;
    this.timeoutMs = options.timeoutMs ?? 8_000;
    this.retries = options.retries ?? 1;
    this.logger = options.logger ?? (() => undefined);
  }

  suggest(request: {
    requestId: string;
    actor: AiActorContext;
    input: AiDiagnosisInput;
  }): Promise<AiDiagnosisDecision> {
    const idempotencyKey = `${request.actor.organizationId}:${request.actor.userId}:${request.requestId}`;
    const nowMs = this.now();
    const completed = this.completed.get(idempotencyKey);
    if (completed && completed.expiresAt > nowMs) {
      return Promise.resolve(completed.decision);
    }
    if (completed) this.completed.delete(idempotencyKey);
    const pending = this.inFlight.get(idempotencyKey);
    if (pending) return pending;
    const operation = this.execute(request)
      .then((result) => {
        this.completed.set(idempotencyKey, {
          decision: result,
          expiresAt: this.now() + 5 * 60_000,
        });
        if (this.completed.size > 500) {
          const oldest = this.completed.keys().next().value;
          if (oldest) this.completed.delete(oldest);
        }
        return result;
      })
      .finally(() => this.inFlight.delete(idempotencyKey));
    this.inFlight.set(idempotencyKey, operation);
    return operation;
  }

  getOrganizationUsage(organizationId: string) {
    return this.usageLedger.getOrganizationTotals(organizationId);
  }

  private async execute(request: {
    requestId: string;
    actor: AiActorContext;
    input: AiDiagnosisInput;
  }): Promise<AiDiagnosisDecision> {
    if (this.options.availability === "disabled") {
      return fallback(
        "disabled",
        "Live AI is off. The deterministic rule trace remains fully available.",
      );
    }
    if (this.options.availability === "missing-key" || !this.provider) {
      return fallback(
        "missing-key",
        "No server-side OpenAI credential is available. The rule trace remains active.",
      );
    }
    if (!shouldRequestAiSuggestion(request.input)) {
      return fallback(
        "not-needed",
        "The deterministic evidence does not need model disambiguation.",
      );
    }
    const nowMs = this.now();
    if (!this.circuitBreaker.canAttempt(nowMs)) {
      this.logger({
        status: "circuit-open",
        model: this.options.model,
        latencyMs: 0,
      });
      return fallback(
        "circuit-open",
        "AI assist is temporarily paused after repeated provider failures.",
      );
    }
    if (!this.rateLimiter.consume(request.actor, nowMs)) {
      this.logger({
        status: "rate-limited",
        model: this.options.model,
        latencyMs: 0,
      });
      return fallback(
        "rate-limited",
        "AI assist reached its review limit. Continue with the rule trace and tutor judgment.",
      );
    }

    const startedAt = this.now();
    let lastReason: "timeout" | "provider-error" | "malformed-output" =
      "provider-error";
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const providerResult = await this.provider.suggest(request.input, {
          signal: controller.signal,
          safetyIdentifier: safetyIdentifier(request.actor),
        });
        const parsed = aiDiagnosisSuggestionSchema.safeParse(
          providerResult.output,
        );
        if (!parsed.success) {
          lastReason = "malformed-output";
          continue;
        }
        const suggestion: AiDiagnosisSuggestion = parsed.data;
        const policyReview = reviewAiSuggestionPolicy(
          request.input,
          suggestion,
        );
        const usage = this.usageLedger.recordSuccess(
          request.actor.organizationId,
          providerResult.usage,
          providerResult.modelVersion,
        );
        const audit: AiDiagnosisAuditSnapshot = {
          source: "openai",
          requestId: request.requestId,
          inputFingerprint: fingerprint(request.input),
          suggestion,
          policyReview,
          modelVersion: providerResult.modelVersion,
          promptVersion: AI_DIAGNOSIS_PROMPT_VERSION,
          schemaVersion: AI_DIAGNOSIS_SCHEMA_VERSION,
          generatedAt: new Date(this.now()).toISOString(),
          usage,
        };
        this.circuitBreaker.recordSuccess();
        this.logger({
          status: "suggested",
          model: providerResult.modelVersion,
          latencyMs: this.now() - startedAt,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
        });
        return { status: "suggested", audit };
      } catch (error) {
        lastReason =
          controller.signal.aborted ||
          (error instanceof Error && error.name === "AbortError")
            ? "timeout"
            : "provider-error";
      } finally {
        clearTimeout(timeout);
      }
    }

    this.circuitBreaker.recordFailure(this.now());
    this.usageLedger.recordFailure(request.actor.organizationId);
    this.logger({
      status: "fallback",
      model: this.options.model,
      latencyMs: this.now() - startedAt,
      errorCategory: lastReason,
    });
    const messages = {
      timeout:
        "AI assist timed out. The deterministic rule trace remains available.",
      "provider-error":
        "AI assist is unavailable. The deterministic rule trace remains available.",
      "malformed-output":
        "AI assist returned an invalid structure and was safely discarded.",
    };
    return fallback(lastReason, messages[lastReason]);
  }
}

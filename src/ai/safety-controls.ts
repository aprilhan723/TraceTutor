import type { AiActorContext } from "@/domain/ai-diagnosis";

interface Bucket {
  timestamps: number[];
}

export class AiRateLimiter {
  private readonly userBuckets = new Map<string, Bucket>();
  private readonly organizationBuckets = new Map<string, Bucket>();

  constructor(
    private readonly userLimit = 6,
    private readonly organizationLimit = 30,
    private readonly windowMs = 60 * 60 * 1000,
  ) {}

  consume(actor: AiActorContext, nowMs: number) {
    const user = this.active(this.userBuckets, actor.userId, nowMs);
    const organization = this.active(
      this.organizationBuckets,
      actor.organizationId,
      nowMs,
    );
    if (
      user.timestamps.length >= this.userLimit ||
      organization.timestamps.length >= this.organizationLimit
    ) {
      return false;
    }
    user.timestamps.push(nowMs);
    organization.timestamps.push(nowMs);
    return true;
  }

  private active(map: Map<string, Bucket>, key: string, nowMs: number) {
    const bucket = map.get(key) ?? { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter(
      (timestamp) => nowMs - timestamp < this.windowMs,
    );
    map.set(key, bucket);
    return bucket;
  }
}

export class AiCircuitBreaker {
  private consecutiveFailures = 0;
  private openedAt: number | null = null;

  constructor(
    private readonly failureThreshold = 3,
    private readonly cooldownMs = 60_000,
  ) {}

  canAttempt(nowMs: number) {
    if (this.openedAt === null) return true;
    if (nowMs - this.openedAt < this.cooldownMs) return false;
    this.openedAt = null;
    this.consecutiveFailures = 0;
    return true;
  }

  recordSuccess() {
    this.consecutiveFailures = 0;
    this.openedAt = null;
  }

  recordFailure(nowMs: number) {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.failureThreshold) {
      this.openedAt = nowMs;
    }
  }
}

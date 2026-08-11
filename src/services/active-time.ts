import type { StudySessionStatus } from "@/domain/study";

export const ACTIVE_IDLE_THRESHOLD_MS = 90_000;
export const ACTIVE_HEARTBEAT_SECONDS = 15;

export interface ActiveTimeSignal {
  sessionStatus: StudySessionStatus;
  documentVisible: boolean;
  nowMs: number;
  lastInteractionMs: number;
  idleThresholdMs?: number;
}

export function shouldAccumulateActiveTime(signal: ActiveTimeSignal) {
  return (
    signal.sessionStatus === "active" &&
    signal.documentVisible &&
    signal.nowMs - signal.lastInteractionMs <=
      (signal.idleThresholdMs ?? ACTIVE_IDLE_THRESHOLD_MS)
  );
}

export function activeMinutesFromSeconds(seconds: number) {
  return Math.floor(Math.max(0, seconds) / 60);
}

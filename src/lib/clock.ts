export interface Clock {
  now(): Date;
}

export interface AdjustableClock extends Clock {
  setDateKey(dateKey: string): void;
  reset(): void;
}

interface ClockStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DEMO_NOW_ISO = "2026-08-10T09:00:00.000Z";
export const DEMO_CLOCK_STORAGE_KEY = "tracetutor.demo.clock.v1";

export class FixedClock implements Clock {
  constructor(private readonly value = DEMO_NOW_ISO) {}

  now() {
    return new Date(this.value);
  }
}

export class LocalDemoClock implements AdjustableClock {
  constructor(private readonly storage: ClockStore) {}

  now() {
    const saved = this.storage.getItem(DEMO_CLOCK_STORAGE_KEY);
    return new Date(saved ?? DEMO_NOW_ISO);
  }

  setDateKey(dateKey: string) {
    this.storage.setItem(DEMO_CLOCK_STORAGE_KEY, `${dateKey}T09:00:00.000Z`);
  }

  reset() {
    this.storage.removeItem(DEMO_CLOCK_STORAGE_KEY);
  }
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

export function differenceInDays(laterDateKey: string, earlierDateKey: string) {
  const later = new Date(`${laterDateKey}T12:00:00.000Z`).getTime();
  const earlier = new Date(`${earlierDateKey}T12:00:00.000Z`).getTime();
  return Math.max(0, Math.ceil((later - earlier) / 86_400_000));
}

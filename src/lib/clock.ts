export interface Clock {
  now(): Date;
}

export const DEMO_NOW_ISO = "2026-08-10T09:00:00.000Z";

export class FixedClock implements Clock {
  constructor(private readonly value = DEMO_NOW_ISO) {}

  now() {
    return new Date(this.value);
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

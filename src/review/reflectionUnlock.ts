import { getCurrentWeekRange } from '../confidence/confidence';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Rolling 7-day window chosen to create a predictable “weekly ritual” regardless of calendar weeks.
// Uses local device time consistently via JS Date.
export function getRollingWindow(days: number = 7, nowMs: number = Date.now()): { start: Date; end: Date } {
  const end = new Date(nowMs);
  const start = new Date(nowMs - days * MS_PER_DAY);
  return { start, end };
}

export function isWithinWindow(input: Date, window: { start: Date; end: Date }): boolean {
  const t = input.getTime();
  return t >= window.start.getTime() && t <= window.end.getTime();
}

export function daysUntilNextUnlock(anchorIso: string | null, days: number = 7, nowMs: number = Date.now()): number {
  if (!anchorIso) return days;
  const anchor = new Date(anchorIso);
  const elapsedMs = nowMs - anchor.getTime();
  const remainingMs = days * MS_PER_DAY - elapsedMs;
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / MS_PER_DAY);
}

export type ReviewUnlockState =
  | { kind: 'CACHED_THIS_WINDOW' }
  | { kind: 'LOCKED_TIME'; daysRemaining: number }
  | { kind: 'LOCKED_WEEKDAY'; daysRemaining: number }
  | { kind: 'LOCKED_DATA' }
  | { kind: 'UNLOCKED' };

function startOfDayMs(nowMs: number): number {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function lastDayUnlock(input: { nowMs: number; weekStartDay: number }): { isLastDay: boolean; daysRemaining: number } {
  const week = getCurrentWeekRange(input.nowMs, input.weekStartDay);
  const weekEndMs = week.end.getTime();
  const lastDayStartMs = startOfDayMs(weekEndMs - MS_PER_DAY);

  const todayStartMs = startOfDayMs(input.nowMs);
  const isLastDay = todayStartMs >= lastDayStartMs && todayStartMs < weekEndMs;
  const remainingMs = lastDayStartMs - todayStartMs;
  const daysRemaining = remainingMs <= 0 ? 0 : Math.ceil(remainingMs / MS_PER_DAY);
  return { isLastDay, daysRemaining };
}

export function getReviewUnlockState(input: {
  nowMs: number;
  days?: number;
  weekStartDay: number;
  firstAppUseAtIso: string | null;
  lastReflectionAtIso: string | null;
  hasAtLeastOneDecisionInWindow: boolean;
  cachedGeneratedAtIso: string | null;
}): ReviewUnlockState {
  const lastDay = lastDayUnlock({ nowMs: input.nowMs, weekStartDay: input.weekStartDay });
  const week = getCurrentWeekRange(input.nowMs, input.weekStartDay);
  const window = { start: week.start, end: week.end };

  if (!lastDay.isLastDay) {
    return { kind: 'LOCKED_WEEKDAY', daysRemaining: lastDay.daysRemaining };
  }

  if (input.cachedGeneratedAtIso) {
    const cachedAt = new Date(input.cachedGeneratedAtIso);
    if (isWithinWindow(cachedAt, window)) {
      return { kind: 'CACHED_THIS_WINDOW' };
    }
  }

  if (!input.hasAtLeastOneDecisionInWindow) {
    return { kind: 'LOCKED_DATA' };
  }

  return { kind: 'UNLOCKED' };
}

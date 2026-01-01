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
  | { kind: 'LOCKED_DATA' }
  | { kind: 'UNLOCKED' };

export function getReviewUnlockState(input: {
  nowMs: number;
  days?: number;
  firstAppUseAtIso: string | null;
  lastReflectionAtIso: string | null;
  hasAtLeastOneDecisionInWindow: boolean;
  cachedGeneratedAtIso: string | null;
}): ReviewUnlockState {
  const days = input.days ?? 7;
  const window = getRollingWindow(days, input.nowMs);

  if (input.cachedGeneratedAtIso) {
    const cachedAt = new Date(input.cachedGeneratedAtIso);
    if (isWithinWindow(cachedAt, window)) {
      return { kind: 'CACHED_THIS_WINDOW' };
    }
  }

  const anchor = input.lastReflectionAtIso ?? input.firstAppUseAtIso;
  const daysRemaining = daysUntilNextUnlock(anchor, days, input.nowMs);
  const timeUnlocked = daysRemaining === 0;

  if (!timeUnlocked) {
    return { kind: 'LOCKED_TIME', daysRemaining };
  }

  if (!input.hasAtLeastOneDecisionInWindow) {
    return { kind: 'LOCKED_DATA' };
  }

  return { kind: 'UNLOCKED' };
}

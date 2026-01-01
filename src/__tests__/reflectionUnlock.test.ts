import { daysUntilNextUnlock, getReviewUnlockState, getRollingWindow } from '../review/reflectionUnlock';

declare const describe: any;
declare const test: any;
declare const expect: any;

describe('reflection unlock (rolling 7-day ritual)', () => {
  test('daysUntilNextUnlock: returns ceil days remaining', () => {
    const nowMs = new Date('2025-01-08T00:00:00.000Z').getTime();
    const anchorIso = '2025-01-02T12:00:00.000Z';
    // 5.5 days elapsed -> 1.5 days remaining -> ceil => 2
    expect(daysUntilNextUnlock(anchorIso, 7, nowMs)).toBe(2);
  });

  test('time-locked state when <7 days since first use', () => {
    const nowMs = new Date('2025-01-03T00:00:00.000Z').getTime();
    const firstUseIso = '2025-01-01T00:00:00.000Z';

    const state = getReviewUnlockState({
      nowMs,
      days: 7,
      firstAppUseAtIso: firstUseIso,
      lastReflectionAtIso: null,
      hasAtLeastOneDecisionInWindow: true,
      cachedGeneratedAtIso: null,
    });

    expect(state.kind).toBe('LOCKED_TIME');
  });

  test('data-locked state when time unlocked but no decisions in window', () => {
    const nowMs = new Date('2025-01-10T00:00:00.000Z').getTime();
    const firstUseIso = '2025-01-01T00:00:00.000Z';

    const state = getReviewUnlockState({
      nowMs,
      days: 7,
      firstAppUseAtIso: firstUseIso,
      lastReflectionAtIso: null,
      hasAtLeastOneDecisionInWindow: false,
      cachedGeneratedAtIso: null,
    });

    expect(state.kind).toBe('LOCKED_DATA');
  });

  test('unlocked state when time unlocked and has >=1 decision', () => {
    const nowMs = new Date('2025-01-10T00:00:00.000Z').getTime();
    const firstUseIso = '2025-01-01T00:00:00.000Z';

    const state = getReviewUnlockState({
      nowMs,
      days: 7,
      firstAppUseAtIso: firstUseIso,
      lastReflectionAtIso: null,
      hasAtLeastOneDecisionInWindow: true,
      cachedGeneratedAtIso: null,
    });

    expect(state.kind).toBe('UNLOCKED');
  });

  test('cached state when cached generatedAt is within current window', () => {
    const nowMs = new Date('2025-01-10T00:00:00.000Z').getTime();
    const window = getRollingWindow(7, nowMs);
    const cachedIso = new Date(window.start.getTime() + 60 * 60 * 1000).toISOString();

    const state = getReviewUnlockState({
      nowMs,
      days: 7,
      firstAppUseAtIso: '2025-01-01T00:00:00.000Z',
      lastReflectionAtIso: '2025-01-02T00:00:00.000Z',
      hasAtLeastOneDecisionInWindow: true,
      cachedGeneratedAtIso: cachedIso,
    });

    expect(state.kind).toBe('CACHED_THIS_WINDOW');
  });
});

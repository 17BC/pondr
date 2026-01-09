import { computeDirectionStatus } from '../confidence/confidence';

describe('computeDirectionStatus', () => {
  test('count=0 -> NO_SIGNAL', () => {
    expect(computeDirectionStatus(0, null)).toBe('NO_SIGNAL');
  });

  test('count=1 avg=3.0 -> STABLE', () => {
    expect(computeDirectionStatus(1, 3.0)).toBe('STABLE');
  });

  test('count=2 avg=2.0 -> DRIFTING', () => {
    expect(computeDirectionStatus(2, 2.0)).toBe('DRIFTING');
  });

  test('count=3 avg=4.2 -> GROWING', () => {
    expect(computeDirectionStatus(3, 4.2)).toBe('GROWING');
  });

  test('count=5 avg=3.2 -> STABLE', () => {
    expect(computeDirectionStatus(5, 3.2)).toBe('STABLE');
  });

  test('count=5 avg=2.2 -> DRIFTING', () => {
    expect(computeDirectionStatus(5, 2.2)).toBe('DRIFTING');
  });
});

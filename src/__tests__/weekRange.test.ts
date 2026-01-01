import { startOfWeekMs, getCurrentWeekRange } from '../confidence/confidence';

declare const describe: any;
declare const test: any;
declare const expect: any;

describe('calendar week range respects weekStartDay', () => {
  test('startOfWeekMs: Sunday start (0) anchors to Sunday 00:00 local', () => {
    const now = new Date(2025, 0, 8, 10, 0, 0, 0).getTime();
    const startMs = startOfWeekMs(now, 0);
    const start = new Date(startMs);

    expect(start.getDay()).toBe(0);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  test('getCurrentWeekRange: Friday start (5) produces 7-day span', () => {
    const now = new Date(2025, 0, 8, 10, 0, 0, 0).getTime();
    const range = getCurrentWeekRange(now, 5);

    expect(range.start.getDay()).toBe(5);
    expect(range.end.getTime() - range.start.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

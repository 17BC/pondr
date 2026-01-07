jest.mock('./db', () => {
  return {
    getDb: jest.fn(),
  };
});

import { getCurrentWeekRange } from '../../confidence/confidence';
import { getDb } from './db';
import { getInsightsSnapshot } from './decisions';

describe('getInsightsSnapshot - Decision Focus window', () => {
  test('Decision Focus uses current week range (start/end) rather than recentStartAt only', async () => {
    const nowMs = new Date('2026-01-07T12:00:00.000Z').getTime();
    const weekStartDay = 1;

    const weekRange = getCurrentWeekRange(nowMs, weekStartDay);
    const expectedWeekStartAt = weekRange.start.getTime();
    const expectedWeekEndAt = weekRange.end.getTime();

    const focusSql =
      'SELECT category, COUNT(1) as count FROM decisions WHERE createdAt >= ? AND createdAt < ? GROUP BY category ORDER BY count DESC LIMIT 2;';

    const fakeDb = {
      getAllAsync: jest.fn(async (sql: string, params?: any[]) => {
        if (sql === focusSql) {
          return [{ category: 'health', count: 2 }];
        }

        if (sql.includes('AVG(confidence)') && sql.includes('HAVING COUNT(1) >= 2')) {
          return [];
        }

        if (sql.includes('GROUP BY dayStartAt')) {
          return [];
        }

        if (sql.includes('SELECT category, AVG(confidence)')) {
          return [];
        }

        if (sql.includes('SELECT category FROM decisions ORDER BY createdAt DESC LIMIT 10')) {
          return [];
        }

        return [];
      }),
      getFirstAsync: jest.fn(async (sql: string, params?: any[]) => {
        if (sql.includes('SELECT COUNT(1) as count')) {
          return { count: 2 };
        }
        if (sql.includes('SELECT AVG(confidence) as avg')) {
          return { avg: 3 };
        }
        return null;
      }),
    };

    (getDb as unknown as jest.Mock).mockResolvedValue(fakeDb);

    await getInsightsSnapshot(nowMs, weekStartDay);

    expect(fakeDb.getAllAsync).toHaveBeenCalledWith(focusSql, [expectedWeekStartAt, expectedWeekEndAt]);
  });
});

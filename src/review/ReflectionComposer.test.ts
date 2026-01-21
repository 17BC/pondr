import { composeWeeklyReflection } from './ReflectionComposer';

function hasBannedLanguage(text: string): string[] {
  const lower = text.toLowerCase();
  const banned = [
    'should',
    'need to',
    'fix',
    'improve',
    'better',
    'wrong',
    'you felt',
  ];
  return banned.filter((w) => lower.includes(w));
}

describe('ReflectionComposer', () => {
  test('same week + same userId -> same output', () => {
    const base = {
      userId: 'user-123',
      weekStartDate: '2026-01-05T00:00:00.000Z',
      weekEndDate: '2026-01-12T00:00:00.000Z',
      metrics: {
        decisionCount: 6,
        topCategory: 'Health',
        secondaryCategory: 'Career',
        categoryOverlaps: { a: 'Health', b: 'Career' },
        avgConfidence: 3.3,
        confidenceTrend: 'STEADY' as const,
        mostRepeatedTag: 'sleep',
        daysWithDecisions: 4,
      },
    };

    const a = composeWeeklyReflection(base);
    const b = composeWeeklyReflection(base);
    expect(a.text).toBe(b.text);
  });

  test('next week -> different variation (seed changes)', () => {
    const base = {
      userId: 'user-123',
      weekStartDate: '2026-01-05T00:00:00.000Z',
      weekEndDate: '2026-01-12T00:00:00.000Z',
      metrics: {
        decisionCount: 6,
        topCategory: 'Health',
        secondaryCategory: 'Career',
        categoryOverlaps: { a: 'Health', b: 'Career' },
        avgConfidence: 3.3,
        confidenceTrend: 'STEADY' as const,
        mostRepeatedTag: 'sleep',
        daysWithDecisions: 4,
      },
    };

    const week1 = composeWeeklyReflection(base);
    const week2 = composeWeeklyReflection({
      ...base,
      weekStartDate: '2026-01-12T00:00:00.000Z',
      weekEndDate: '2026-01-19T00:00:00.000Z',
    });

    expect(week1.text).not.toBe(week2.text);
  });

  test('no decisions -> neutral copy', () => {
    const out = composeWeeklyReflection({
      userId: 'user-123',
      weekStartDate: '2026-01-05T00:00:00.000Z',
      weekEndDate: '2026-01-12T00:00:00.000Z',
      metrics: {
        decisionCount: 0,
        topCategory: null,
        secondaryCategory: null,
        categoryOverlaps: null,
        avgConfidence: null,
        confidenceTrend: 'NA' as const,
        mostRepeatedTag: null,
        daysWithDecisions: 0,
      },
    });

    expect(out.text).toContain("There weren’t any decisions logged this week");
  });

  test('generated copy contains no judgmental / prescriptive language', () => {
    const out = composeWeeklyReflection({
      userId: 'user-456',
      weekStartDate: '2026-02-02T00:00:00.000Z',
      weekEndDate: '2026-02-09T00:00:00.000Z',
      metrics: {
        decisionCount: 2,
        topCategory: 'Learning',
        secondaryCategory: null,
        categoryOverlaps: null,
        avgConfidence: 2.2,
        confidenceTrend: 'NA' as const,
        mostRepeatedTag: null,
        daysWithDecisions: 2,
      },
    });

    expect(hasBannedLanguage(out.text)).toEqual([]);
  });
});

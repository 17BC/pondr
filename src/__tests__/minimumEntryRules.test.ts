import { computeConfidenceTrend, confidenceTrendCopy } from '../confidence/confidence';
import { decisionFocusCopyFromCounts } from '../insights/insightsLogic';

declare const describe: any;
declare const test: any;
declare const expect: any;

describe('minimum-entry rules', () => {
  test('Decision Focus tie: two categories with same count shows no-clear-focus copy', () => {
    const out = decisionFocusCopyFromCounts([
      { category: 'career', count: 2 },
      { category: 'health', count: 2 },
    ]);
    expect(out.copy).toBe('No clear focus yet — your decisions are spread across a few areas.');
  });

  test('Confidence Trend: missing data yields NA copy', () => {
    const trend = computeConfidenceTrend(3.8, null);
    expect(trend).toBe('NA');
    expect(confidenceTrendCopy(trend)).toBe('Log a few decisions over time to see a confidence trend.');
  });
});

import { computeCategoryOverlapSummary } from '../insights/categoryOverlaps';
import type { DecisionCategory } from '../models/decision';

describe('computeCategoryOverlapSummary', () => {
  test('returns null pair when there are no overlaps', () => {
    const decisions: Array<{ category: DecisionCategory; secondaryCategories: DecisionCategory[] }> = [
      { category: 'career', secondaryCategories: [] },
      { category: 'health', secondaryCategories: [] },
    ];

    const out = computeCategoryOverlapSummary({ decisions });
    expect(out.overlapDecisionCount).toBe(0);
    expect(out.mostCommonPair).toBe(null);
  });

  test('counts overlap decisions and most common pair', () => {
    const decisions: Array<{ category: DecisionCategory; secondaryCategories: DecisionCategory[] }> = [
      { category: 'career', secondaryCategories: ['health'] }, // career+health
      { category: 'career', secondaryCategories: ['health', 'learning'] }, // career+health, career+learning
      { category: 'health', secondaryCategories: ['career'] }, // career+health
      { category: 'learning', secondaryCategories: [] },
    ];

    const out = computeCategoryOverlapSummary({ decisions });
    expect(out.overlapDecisionCount).toBe(3);
    expect(out.mostCommonPair).toEqual({ a: 'career', b: 'health' });
  });
});

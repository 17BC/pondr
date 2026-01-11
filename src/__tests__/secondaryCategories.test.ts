import { normalizeSecondaryCategories, toggleSecondaryCategory } from '../utils/secondaryCategories';
import type { DecisionCategory } from '../models/decision';

describe('secondaryCategories helpers', () => {
  test('toggleSecondaryCategory enforces max=2 and excludes primary', () => {
    const primary: DecisionCategory = 'career';

    let current: DecisionCategory[] = [];
    current = toggleSecondaryCategory({ primary, current, next: 'health' });
    current = toggleSecondaryCategory({ primary, current, next: 'learning' });
    current = toggleSecondaryCategory({ primary, current, next: 'relationships' });

    expect(current).toEqual(['health', 'learning']);

    // Cannot add primary
    current = toggleSecondaryCategory({ primary, current, next: 'career' });
    expect(current).toEqual(['health', 'learning']);

    // Can remove an existing item
    current = toggleSecondaryCategory({ primary, current, next: 'health' });
    expect(current).toEqual(['learning']);
  });

  test('normalizeSecondaryCategories dedupes, removes primary, caps to max', () => {
    const out = normalizeSecondaryCategories({
      primary: 'health',
      secondary: ['health', 'career', 'career', 'learning'],
      max: 2,
    });
    expect(out).toEqual(['career', 'learning']);
  });
});

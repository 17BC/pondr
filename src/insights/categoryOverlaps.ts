import type { DecisionCategory } from '../models/decision';

export type OverlapPair = { a: DecisionCategory; b: DecisionCategory };

export function computeCategoryOverlapSummary(input: {
  decisions: Array<{ category: DecisionCategory; secondaryCategories: DecisionCategory[] }>;
}): { overlapDecisionCount: number; mostCommonPair: OverlapPair | null } {
  const overlapDecisions = input.decisions.filter((d) => (d.secondaryCategories ?? []).length > 0);
  const overlapDecisionCount = overlapDecisions.length;

  const pairCounts = new Map<string, number>();

  for (const d of overlapDecisions) {
    for (const sec of d.secondaryCategories) {
      const a = String(d.category) < String(sec) ? d.category : sec;
      const b = String(d.category) < String(sec) ? sec : d.category;
      const key = `${a}|${b}`;
      pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
    }
  }

  let bestKey: string | null = null;
  let bestCount = 0;
  for (const [key, count] of pairCounts.entries()) {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  }

  if (!bestKey) return { overlapDecisionCount, mostCommonPair: null };

  const [a, b] = bestKey.split('|') as [DecisionCategory, DecisionCategory];
  return { overlapDecisionCount, mostCommonPair: { a, b } };
}

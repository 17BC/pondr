import type { DecisionCategory } from '../models/decision';

export function decisionFocusCopyFromCounts(rows: Array<{ category: string; count: number }>): {
  copy: string;
  topCategory: DecisionCategory | null;
} {
  if (rows.length === 0) return { copy: 'No clear focus yet — your decisions are spread across a few areas.', topCategory: null };

  const sorted = [...rows]
    .map((r) => ({ category: String(r.category) as DecisionCategory, count: Number(r.count ?? 0) }))
    .sort((a, b) => b.count - a.count);

  const top = sorted[0];
  const second = sorted.length > 1 ? sorted[1] : null;

  if (second && second.count === top.count && top.count > 0) {
    return { copy: 'No clear focus yet — your decisions are spread across a few areas.', topCategory: top.category };
  }

  return { copy: `Most of your recent decisions were about ${top.category}.`, topCategory: top.category };
}

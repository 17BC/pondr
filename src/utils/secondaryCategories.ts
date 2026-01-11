import type { DecisionCategory } from '../models/decision';

export function toggleSecondaryCategory(input: {
  primary: DecisionCategory;
  current: DecisionCategory[];
  next: DecisionCategory;
  max?: number;
}): DecisionCategory[] {
  const max = Math.max(0, Math.floor(input.max ?? 2));
  if (input.next === input.primary) return input.current;

  if (input.current.includes(input.next)) {
    return input.current.filter((c) => c !== input.next);
  }

  if (input.current.length >= max) return input.current;
  return [...input.current, input.next];
}

export function normalizeSecondaryCategories(input: {
  primary: DecisionCategory;
  secondary: DecisionCategory[];
  max?: number;
}): DecisionCategory[] {
  const max = Math.max(0, Math.floor(input.max ?? 2));
  const deduped = Array.from(new Set(input.secondary)).filter((c) => c !== input.primary);
  return deduped.slice(0, max);
}

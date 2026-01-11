import type { DecisionCategory, DirectionStatus } from '../models/decision';
import { categoryLabel } from '../utils/categoryLabel';
import type { ConfidenceTrend } from '../confidence/confidence';
import { confidenceTrendCopy as confidenceTrendSentence } from '../confidence/confidence';

export const INSIGHT_TITLES = {
  decision_focus: 'Decision Focus',
  category_overlaps: 'Category Overlaps',
  confidence_by_category: 'Confidence by Category',
  confidence_trend: 'Confidence Trend',
  decision_pace: 'Decision Pace',
  direction_status: 'Direction Status',
  repeated_choice_pattern: 'Repeated Pattern',
} as const;

export function decisionFocusCopy(category: DecisionCategory): string {
  return `Most of your recent decisions were about ${categoryLabel(category)}.`;
}

export function categoryOverlapsCopy(input: {
  overlapDecisionCount: number;
  mostCommonPair: { a: DecisionCategory; b: DecisionCategory } | null;
}): string {
  if (input.overlapDecisionCount < 2 || !input.mostCommonPair) {
    return 'Log a few overlapping decisions to see connections.';
  }

  const pair = `${categoryLabel(input.mostCommonPair.a)} + ${categoryLabel(input.mostCommonPair.b)}`;
  return `This week, ${input.overlapDecisionCount} decisions included more than one category. A common overlap was ${pair}.`;
}

export function confidenceByCategoryCopy(input: { category: DecisionCategory; direction: 'more' | 'less' }): string {
  return `Decisions about ${categoryLabel(input.category)} tend to feel ${input.direction} confident.`;
}

export function confidenceTrendCopy(trend: ConfidenceTrend): string {
  return confidenceTrendSentence(trend);
}

export function decisionPaceCopy(pace: 'more' | 'fewer'): string {
  if (pace === 'more') {
    return 'You’ve been making decisions more frequently than usual.';
  }
  return 'You’ve been making fewer decisions than usual.';
}

export function directionStatusCopy(status: DirectionStatus): string {
  if (status === 'NO_SIGNAL') {
    return 'Not enough data yet. Patterns will appear as you log decisions over time.';
  }
  const label = status === 'GROWING' ? 'Growing' : status === 'STABLE' ? 'Stable' : 'Drifting';
  return `Your current direction looks ${label}.`;
}

export function repeatedChoicePatternCopy(): string {
  return 'Some decisions lately share similar themes.';
}

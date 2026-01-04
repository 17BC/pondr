import type { ConfidenceTrend } from './reviewTypes';
import type { DecisionCategory, DirectionStatus } from '../models/decision';
import { categoryLabel } from '../utils/categoryLabel';
import type { GentleQuestion, GentleQuestionBucketId } from './QuestionBank';
import { QUESTION_BUCKETS } from './QuestionBank';

export type GentleQuestionPatterns = {
  decisionCount: number;
  mostCommonCategory: DecisionCategory | null;
  confidenceTrend: ConfidenceTrend;
  directionStatus: DirectionStatus;
};

export type GentleQuestionSelectionHistory = {
  lastUsedQuestionIds: string[];
};

function chooseBucket(patterns: GentleQuestionPatterns): GentleQuestionBucketId {
  // Rule: select ONE bucket based on observed weekly patterns.
  // Currently implemented bucket logic:
  // - LOW_DATA when there are only a few decisions logged.
  if (patterns.decisionCount <= 2) return 'LOW_DATA';

  if (patterns.directionStatus === 'GROWING') return 'DIRECTION_GROWING';
  if (patterns.directionStatus === 'STABLE') return 'DIRECTION_STABLE';
  if (patterns.directionStatus === 'DRIFTING') return 'DIRECTION_DRIFTING';

  if (patterns.confidenceTrend !== 'NA' && patterns.mostCommonCategory) return 'CATEGORY_CONFIDENCE';
  if (patterns.confidenceTrend !== 'NA') return 'CONFIDENCE_TREND';

  if (patterns.mostCommonCategory) return 'CATEGORY_FOCUS';

  // As more buckets are added, extend this mapping.
  return 'LOW_DATA';
}

function applyPlaceholders(text: string, patterns: GentleQuestionPatterns): string {
  if (!text.includes('{Category}')) return text;

  const category = patterns.mostCommonCategory ? categoryLabel(patterns.mostCommonCategory) : '—';
  return text.replaceAll('{Category}', category);
}

function pickRandom<T>(items: T[]): T {
  const idx = Math.floor(Math.random() * items.length);
  return items[idx];
}

export function selectGentleQuestion(
  patterns: GentleQuestionPatterns,
  history: GentleQuestionSelectionHistory,
  options?: {
    cooldownWeeks?: number;
  }
): { question: GentleQuestion; renderedText: string; bucketId: GentleQuestionBucketId } {
  const bucketId = chooseBucket(patterns);
  const bucket = QUESTION_BUCKETS[bucketId];

  if (!bucket || bucket.length === 0) {
    throw new Error(`No gentle questions configured for bucket: ${bucketId}`);
  }

  const cooldownWeeks = Math.max(0, Math.floor(options?.cooldownWeeks ?? 6));
  const recentIds = history.lastUsedQuestionIds.slice(0, cooldownWeeks);

  const eligible = bucket.filter((q) => !recentIds.includes(q.id));
  const chosen = eligible.length > 0 ? pickRandom(eligible) : pickRandom(bucket);

  return {
    question: chosen,
    renderedText: applyPlaceholders(chosen.text, patterns),
    bucketId,
  };
}

export function nextGentleQuestionHistory(input: {
  selectedQuestionId: string;
  previous: GentleQuestionSelectionHistory;
  maxItems?: number;
}): GentleQuestionSelectionHistory {
  const maxItems = Math.max(1, Math.floor(input.maxItems ?? 12));
  const deduped = [input.selectedQuestionId, ...input.previous.lastUsedQuestionIds.filter((id) => id !== input.selectedQuestionId)];
  return { lastUsedQuestionIds: deduped.slice(0, maxItems) };
}

import type { WeeklySnapshot, WeeklyReflection } from '../../review/reviewTypes';
import { categoryLabel } from '../../utils/categoryLabel';
import { generateReflection } from '../../review/LocalReflectionProvider';

// AI boundaries are enforced in the prompt.
// This service is only allowed to describe the computed snapshot.
// It must not recommend actions or judge the user.

type RollingReflectionInput = {
  windowStartIso: string;
  windowEndIso: string;
  metrics: {
    decisionCount: number;
    focusCopy: string;
    mostCommonCategory: string | null;
    decisionFocus?: {
      focusCategory: string | null;
      isTie: boolean;
    };
    confidenceByCategoryInsight?: {
      kind: 'MORE' | 'LESS' | 'NONE';
      category: string | null;
    };
    pace?: 'MORE' | 'FEWER' | 'TYPICAL' | 'NA';
    avgConfidence: number | null;
    confidenceTrend: string;
    directionStatus: string;
    notablePatterns: string[];
  };
};

export type RollingReflectionResult = {
  reflectionText: string;
  observedPatternText: string;
  gentleQuestionText: string | null;
};

export async function generateWeeklyReflection(input: { snapshot: WeeklySnapshot }): Promise<WeeklyReflection> {
  const category = input.snapshot.mostCommonCategory ? categoryLabel(input.snapshot.mostCommonCategory) : null;
  const out = generateReflection({
    decisionCount: input.snapshot.decisionsThisWeek,
    directionStatus: input.snapshot.directionStatus,
    confidenceTrend: input.snapshot.confidenceTrend,
    decisionFocus: {
      focusCategory: category,
      isTie: input.snapshot.mostCommonCategory === null,
    },
    confidenceByCategoryInsight: { kind: 'NONE', category: null },
  });

  return {
    weekId: input.snapshot.weekId,
    createdAt: Date.now(),
    reflection: out.reflectionText,
    observedPattern: out.observedPatternText,
    question: null,
  };
}

export async function generateRollingReflection(input: RollingReflectionInput): Promise<RollingReflectionResult> {
  const focusCategory =
    input.metrics.decisionFocus?.focusCategory ?? input.metrics.mostCommonCategory ?? null;

  const focusIsTie = input.metrics.decisionFocus?.isTie ?? focusCategory === null;

  const byCatKind = input.metrics.confidenceByCategoryInsight?.kind ?? 'NONE';
  const byCatCategory = input.metrics.confidenceByCategoryInsight?.category ?? null;

  const out = generateReflection({
    decisionCount: input.metrics.decisionCount,
    directionStatus: input.metrics.directionStatus as any,
    confidenceTrend: input.metrics.confidenceTrend as any,
    decisionFocus: {
      focusCategory,
      isTie: focusIsTie,
    },
    confidenceByCategoryInsight: {
      kind: byCatKind,
      category: byCatCategory,
    },
    pace: input.metrics.pace ?? 'NA',
  });

  return {
    reflectionText: out.reflectionText,
    observedPatternText: out.observedPatternText,
    gentleQuestionText: null,
  };
}

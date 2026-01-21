import type { ConfidenceTrend } from './reviewTypes';

export type ReflectionComposerInputs = {
  decisionCount: number;
  topCategory: string | null;
  secondaryCategory: string | null;
  categoryOverlaps: { a: string; b: string } | null;
  avgConfidence: number | null;
  confidenceTrend: ConfidenceTrend;
  mostRepeatedTag: string | null;
  daysWithDecisions: number;
  weekStartDate: string; // ISO string
  weekEndDate: string; // ISO string
};

export type WeeklyReflectionComposition = {
  title: 'Weekly Reflection';
  text: string;
};

function fnv1a32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickVariant(variants: string[], seedKey: string): string {
  if (variants.length === 0) return '';
  if (variants.length === 1) return variants[0];
  const seed = fnv1a32(seedKey);
  const rnd = mulberry32(seed)();
  const idx = Math.floor(rnd * variants.length);
  return variants[Math.min(Math.max(idx, 0), variants.length - 1)];
}

function isHighConfidence(avgConfidence: number | null): boolean {
  return avgConfidence !== null && avgConfidence >= 4.0;
}

function isLowConfidence(avgConfidence: number | null): boolean {
  return avgConfidence !== null && avgConfidence <= 2.5;
}

function hasMixedCategories(input: ReflectionComposerInputs): boolean {
  return Boolean(input.topCategory && input.secondaryCategory && input.topCategory !== input.secondaryCategory);
}

function normalizeSpacing(text: string): string {
  return text
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function composeWeeklyReflection(input: {
  userId: string;
  weekStartDate: string; // ISO string
  weekEndDate: string; // ISO string
  metrics: Omit<ReflectionComposerInputs, 'weekStartDate' | 'weekEndDate'>;
}): WeeklyReflectionComposition {
  const weekStartIso = input.weekStartDate;
  const weekEndIso = input.weekEndDate;

  const metrics: ReflectionComposerInputs = {
    ...input.metrics,
    weekStartDate: weekStartIso,
    weekEndDate: weekEndIso,
  };

  const baseSeedKey = `${input.userId}|${weekStartIso}`;

  if (metrics.decisionCount <= 0) {
    return {
      title: 'Weekly Reflection',
      text: "There weren’t any decisions logged this week. Reflection will be available once decisions are recorded.",
    };
  }

  const lowDataThreshold = 2;
  const isLowData = metrics.decisionCount > 0 && metrics.decisionCount <= lowDataThreshold;

  const openerVariants = [
    'This is a look back at the decisions you logged this week.',
    'Here’s a quiet summary of the choices you recorded.',
    'This reflection gathers what showed up in your decisions this week.',
  ];

  const summaryVariants = [
    'You logged {decisionCount} decisions, most often around {topCategory}.',
    'This week included {decisionCount} decisions, with {topCategory} appearing most.',
    'Across {decisionCount} logged decisions, {topCategory} showed up most often.',
  ];

  const summaryLowDataVariants = [
    'You logged {decisionCount} decision{s} this week.',
    'This week included {decisionCount} recorded decision{s}.',
  ];

  const patternOverlapVariants = [
    'Some decisions connected more than one area, especially {overlapA} and {overlapB}.',
    'A few decisions linked multiple areas, with {overlapA} and {overlapB} showing up together.',
  ];

  const patternNoOverlapVariants = [
    'Most decisions stayed within a single focus area.',
    'Most entries stayed within one category at a time.',
  ];

  const confidenceTrendVariants: Record<ConfidenceTrend, string[]> = {
    UP: [
      'Confidence appeared to trend upward across the week.',
      'Overall, confidence seemed to rise a bit across the week.',
    ],
    DOWN: [
      'Confidence appeared to drift downward across the week.',
      'Overall, confidence seemed to soften across the week.',
    ],
    STEADY: [
      'Confidence tended to stay steady across the week.',
      'Overall, confidence appeared fairly consistent across the week.',
    ],
    NA: [
      'There isn’t enough data to describe a confidence trend yet.',
      'There isn’t enough information this week to describe a confidence trend.',
    ],
  };

  const confidenceByTagVariants = [
    'One repeated tag was “{tag},” which may help explain what kept returning in the log.',
    '“{tag}” showed up more than once, which may be one small thread across the week.',
  ];

  const questionHighConfidence = [
    'What helped things feel clearer this week?',
    'When confidence was higher, what seemed to support that clarity?',
  ];

  const questionLowConfidence = [
    'Where did you want more time or information?',
    'In which moments did you wish the decision had more context?',
  ];

  const questionMixedCategories = [
    'Which area seemed to influence the others most?',
    'Did one category appear to shape how the others showed up?',
  ];

  const questionLowData = [
    'Is there a decision you wish you had captured?',
    'Is there a moment this week that didn’t get logged but still feels relevant?',
  ];

  const questionDefault = [
    'What stands out most when you look back at what you recorded?',
    'If one decision carried the most weight in attention, which was it?',
  ];

  const closingVariants = [
    'Noticing patterns is often the first step to understanding them.',
    'Some weeks offer clarity, others simply offer information.',
    'Even small logs can hold useful signals over time.',
  ];

  const opener = pickVariant(openerVariants, `${baseSeedKey}|opener`);

  const summaryTemplate = isLowData
    ? pickVariant(summaryLowDataVariants, `${baseSeedKey}|summary_low`)
    : pickVariant(summaryVariants, `${baseSeedKey}|summary`);

  const sSuffix = metrics.decisionCount === 1 ? '' : 's';
  const summary = summaryTemplate
    .replaceAll('{decisionCount}', String(metrics.decisionCount))
    .replaceAll('{s}', sSuffix)
    .replaceAll('{topCategory}', metrics.topCategory ?? 'a mix of areas');

  const pattern = metrics.categoryOverlaps
    ? pickVariant(patternOverlapVariants, `${baseSeedKey}|pattern_overlap`)
        .replaceAll('{overlapA}', metrics.categoryOverlaps.a)
        .replaceAll('{overlapB}', metrics.categoryOverlaps.b)
    : pickVariant(patternNoOverlapVariants, `${baseSeedKey}|pattern_no_overlap`);

  const confidenceLine = pickVariant(confidenceTrendVariants[metrics.confidenceTrend], `${baseSeedKey}|confidence_trend`);

  const tagLine = metrics.mostRepeatedTag
    ? pickVariant(confidenceByTagVariants, `${baseSeedKey}|tag`)
        .replaceAll('{tag}', metrics.mostRepeatedTag)
    : null;

  const questionPool = isLowData
    ? questionLowData
    : isHighConfidence(metrics.avgConfidence)
      ? questionHighConfidence
      : isLowConfidence(metrics.avgConfidence)
        ? questionLowConfidence
        : hasMixedCategories(metrics)
          ? questionMixedCategories
          : questionDefault;

  const question = pickVariant(questionPool, `${baseSeedKey}|question`);

  const maybeClosing = pickVariant(closingVariants, `${baseSeedKey}|closing`);

  const sections: string[] = [
    opener,
    summary,
    pattern,
    [confidenceLine, tagLine].filter(Boolean).join(' '),
    question,
  ];

  if (!isLowData) {
    sections.push(maybeClosing);
  }

  return {
    title: 'Weekly Reflection',
    text: normalizeSpacing(sections.join('\n\n')),
  };
}

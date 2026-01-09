export type TrendWord = 'up' | 'down' | 'steady';

export type ConfidenceByCategoryInsight = {
  kind: 'MORE' | 'LESS' | 'NONE';
  category: string | null;
};

export type Pace = 'MORE' | 'FEWER' | 'TYPICAL' | 'NA';

export type ReflectionInputs = {
  decisionCount: number;
  directionStatus: 'GROWING' | 'STABLE' | 'DRIFTING';
  confidenceTrend: 'UP' | 'DOWN' | 'STEADY' | 'NA';
  decisionFocus: {
    focusCategory: string | null;
    isTie: boolean;
  };
  confidenceByCategoryInsight: ConfidenceByCategoryInsight;
  pace?: Pace;
  weekSeed?: string; // for stable selection if we ever allow seeded choice
};

export type ReflectionTemplate = {
  id: string;
  conditions: {
    minCount?: number;
    maxCount?: number;
    directionStatus?: Array<ReflectionInputs['directionStatus']>;
    confidenceTrend?: Array<ReflectionInputs['confidenceTrend']>;
    focusIsTie?: boolean;
    hasFocusCategory?: boolean;
    byCategoryKind?: Array<ConfidenceByCategoryInsight['kind']>;
    hasByCategoryCategory?: boolean;
    pace?: Array<Pace>;
  };
  text: string;
  patternLine: string;
  limitedDataVariant?: {
    text: string;
    patternLine: string;
  };
};

function trendWord(trend: ReflectionInputs['confidenceTrend']): TrendWord | null {
  if (trend === 'UP') return 'up';
  if (trend === 'DOWN') return 'down';
  if (trend === 'STEADY') return 'steady';
  return null;
}

function applyPlaceholders(input: {
  text: string;
  inputs: ReflectionInputs;
}): string {
  const { inputs } = input;
  const category =
    inputs.decisionFocus.focusCategory ?? inputs.confidenceByCategoryInsight.category ?? '—';
  const trend = trendWord(inputs.confidenceTrend) ?? 'steady';

  return input.text
    .replaceAll('{Count}', String(inputs.decisionCount))
    .replaceAll('{Category}', category)
    .replaceAll('{TrendWord}', trend);
}

function matchesConditions(t: ReflectionTemplate, inputs: ReflectionInputs): boolean {
  const c = t.conditions;
  if (c.minCount !== undefined && inputs.decisionCount < c.minCount) return false;
  if (c.maxCount !== undefined && inputs.decisionCount > c.maxCount) return false;
  if (c.directionStatus && !c.directionStatus.includes(inputs.directionStatus)) return false;
  if (c.confidenceTrend && !c.confidenceTrend.includes(inputs.confidenceTrend)) return false;
  if (c.focusIsTie !== undefined && inputs.decisionFocus.isTie !== c.focusIsTie) return false;
  if (c.hasFocusCategory !== undefined) {
    const has = Boolean(inputs.decisionFocus.focusCategory);
    if (has !== c.hasFocusCategory) return false;
  }
  if (c.byCategoryKind && !c.byCategoryKind.includes(inputs.confidenceByCategoryInsight.kind)) return false;
  if (c.hasByCategoryCategory !== undefined) {
    const has = Boolean(inputs.confidenceByCategoryInsight.category);
    if (has !== c.hasByCategoryCategory) return false;
  }
  if (c.pace && !c.pace.includes(inputs.pace ?? 'NA')) return false;
  return true;
}

export const REFLECTION_TEMPLATES: ReflectionTemplate[] = [
  {
    id: 'NO_DECISIONS_1',
    conditions: { maxCount: 0 },
    text:
      'This week has no logged decisions yet. That can happen for many reasons, including weeks that are quiet or weeks that move quickly. For now, this is simply an empty snapshot. When you do log something, this space will reflect only what was recorded.',
    patternLine: 'No decisions were logged in this window.',
  },

  {
    id: 'LOW_DATA_1',
    conditions: { minCount: 1, maxCount: 2, focusIsTie: true },
    text:
      'You logged {Count} decisions this week, and they were spread across more than one area. With limited data, the pattern can feel light and unfinished, and that’s okay. This is a small slice of what was captured, not a full summary of your week. If anything stands out, it may be more about what you noticed than what the data proves.',
    patternLine: 'With limited data, decisions were spread across a few areas.',
    limitedDataVariant: {
      text:
        'You logged {Count} decisions this week, and the focus is split across a few areas. With limited data, this is simply a snapshot of what was recorded. It’s normal for signals to feel mixed at this size.',
      patternLine: 'With limited data, there isn’t a single dominant focus.',
    },
  },
  {
    id: 'LOW_DATA_2',
    conditions: { minCount: 1, maxCount: 2, focusIsTie: false, hasFocusCategory: true },
    text:
      'You logged {Count} decisions this week, with a clear tilt toward {Category}. With limited data, that doesn’t mean it will stay that way—it simply describes what was recorded. This week’s snapshot is intentionally small and descriptive. If it feels surprising, it may just be a sign that a single decision carried more weight in your attention.',
    patternLine: 'With limited data, {Category} showed up as the most common area.',
    limitedDataVariant: {
      text:
        'You logged {Count} decisions this week, and {Category} appeared most often. With limited data, this is just a small slice of what was logged. It’s normal for one area to stand out when there are only a couple entries.',
      patternLine: 'With limited data, {Category} appeared most often.',
    },
  },
  {
    id: 'LOW_DATA_3',
    conditions: { minCount: 1, maxCount: 2, hasFocusCategory: false },
    text:
      'You logged {Count} decisions this week. With limited data, this space stays intentionally light—more like a note than a conclusion. The snapshot is meant to reflect what was recorded without pressure to interpret it. As more decisions are logged over time, patterns will become easier to see.',
    patternLine: 'With limited data, this is a minimal snapshot.',
  },

  {
    id: 'GROWING_FOCUS_1',
    conditions: { minCount: 3, directionStatus: ['GROWING'], focusIsTie: false, hasFocusCategory: true },
    text:
      'This week your decisions point toward a Growing direction. Many of your logged decisions clustered around {Category}, which can create a feeling of momentum in one area. Confidence has been {TrendWord} recently, which adds a bit more context to the week’s shape. This is simply a description of what was recorded, not a verdict on the week.',
    patternLine: 'Direction looks Growing, with a concentration in {Category}.',
  },
  {
    id: 'GROWING_FOCUS_TREND_UP_1',
    conditions: { minCount: 3, directionStatus: ['GROWING'], confidenceTrend: ['UP'], focusIsTie: false, hasFocusCategory: true },
    text:
      'This week your decisions point toward a Growing direction, with confidence trending {TrendWord}. Many of your logged decisions clustered around {Category}, which makes the week’s shape feel more consistent in the data. This stays descriptive by design, without guessing at causes. It’s a snapshot of what was recorded this week.',
    patternLine: 'Direction looks Growing, and confidence has been trending up.',
  },
  {
    id: 'GROWING_FOCUS_2',
    conditions: { minCount: 3, directionStatus: ['GROWING'], focusIsTie: false, hasFocusCategory: true, byCategoryKind: ['MORE'], hasByCategoryCategory: true },
    text:
      'This week your decisions point toward a Growing direction. A lot of your activity centered on {Category}, and confidence in that area has been relatively higher compared to other categories you logged. Confidence has been {TrendWord} recently, which helps explain the overall direction. The snapshot stays descriptive on purpose, even when the signals look clear.',
    patternLine: 'Direction looks Growing, and {Category} shows relatively higher confidence.',
  },
  {
    id: 'GROWING_SPLIT_1',
    conditions: { minCount: 3, directionStatus: ['GROWING'], focusIsTie: true },
    text:
      'This week your decisions point toward a Growing direction. At the same time, the focus is split across a few areas rather than concentrated in one place. Confidence has been {TrendWord} recently, which may be part of why the direction still looks steady and forward. Mixed focus can still be consistent—it just spreads attention across categories.',
    patternLine: 'Direction looks Growing, with attention spread across multiple areas.',
  },
  {
    id: 'GROWING_GENERAL_1',
    conditions: { minCount: 3, directionStatus: ['GROWING'] },
    text:
      'This week your decisions point toward a Growing direction. The overall shape suggests a steadier sense of confidence across what you logged. Confidence has been {TrendWord} recently, which adds context without needing a deeper explanation. The goal here is only to reflect the patterns that showed up in your entries.',
    patternLine: 'Direction looks Growing based on the week’s logged decisions.',
  },

  {
    id: 'STABLE_FOCUS_1',
    conditions: { minCount: 3, directionStatus: ['STABLE'], focusIsTie: false, hasFocusCategory: true },
    text:
      'This week your decisions point toward a Stable direction. Many entries clustered around {Category}, suggesting a consistent area of attention. Confidence has been {TrendWord} recently, which can coexist with stability. This snapshot is meant to be calm and factual, even when it’s specific.',
    patternLine: 'Direction looks Stable, with a consistent focus in {Category}.',
  },
  {
    id: 'STABLE_SPLIT_1',
    conditions: { minCount: 3, directionStatus: ['STABLE'], focusIsTie: true },
    text:
      'This week your decisions point toward a Stable direction. The focus is spread across a few areas, which can look like variety without being chaotic. Confidence has been {TrendWord} recently, and the overall pattern still reads as steady. This reflects only what was logged, not everything that mattered this week.',
    patternLine: 'Direction looks Stable, with decisions spread across multiple areas.',
  },
  {
    id: 'STABLE_PACE_MORE_1',
    conditions: { minCount: 3, directionStatus: ['STABLE'], pace: ['MORE'] },
    text:
      'This week your decisions point toward a Stable direction. You logged decisions more frequently than your long-run pace, which can make the week feel more active without changing the overall direction. Confidence has been {TrendWord} recently, adding a small layer of context. The snapshot stays descriptive and avoids conclusions.',
    patternLine: 'Direction looks Stable, with a higher-than-usual logging pace.',
  },
  {
    id: 'STABLE_GENERAL_1',
    conditions: { minCount: 3, directionStatus: ['STABLE'] },
    text:
      'This week your decisions point toward a Stable direction. The week’s confidence pattern reads as {TrendWord}, without sharp swings in either direction. In this view, stability simply means the signals are consistent across what you logged. It’s okay if the lived week felt more complex than the snapshot.',
    patternLine: 'Direction looks Stable based on the week’s logged decisions.',
  },

  {
    id: 'DRIFTING_FOCUS_1',
    conditions: { minCount: 3, directionStatus: ['DRIFTING'], focusIsTie: false, hasFocusCategory: true },
    text:
      'This week your decisions point toward a Drifting direction. Many entries clustered around {Category}, and the confidence pattern has been {TrendWord} recently. Drifting here is a descriptive label for lower confidence or thinner consistency in what was logged. The snapshot is meant to hold that gently, without implying anything is wrong.',
    patternLine: 'Direction looks Drifting, with many decisions in {Category}.',
  },
  {
    id: 'DRIFTING_BYCAT_LESS_1',
    conditions: { minCount: 3, directionStatus: ['DRIFTING'], byCategoryKind: ['LESS'], hasByCategoryCategory: true },
    text:
      'This week your decisions point toward a Drifting direction. One signal in the log is that confidence in {Category} has been relatively lower than in other categories you recorded. Confidence has been {TrendWord} recently, which helps explain the overall direction. This isn’t advice—it’s just a description of what the entries show.',
    patternLine: 'Direction looks Drifting, and {Category} shows relatively lower confidence.',
  },
  {
    id: 'DRIFTING_SPLIT_1',
    conditions: { minCount: 3, directionStatus: ['DRIFTING'], focusIsTie: true },
    text:
      'This week your decisions point toward a Drifting direction. The focus is split across a few areas, which can make the week feel less settled in the data. Confidence has been {TrendWord} recently, without a single strong signal pulling the snapshot upward. This view stays intentionally simple, even when the week feels layered.',
    patternLine: 'Direction looks Drifting, with decisions spread across multiple areas.',
  },
  {
    id: 'DRIFTING_SPLIT_TREND_DOWN_1',
    conditions: { minCount: 3, directionStatus: ['DRIFTING'], confidenceTrend: ['DOWN'], focusIsTie: true },
    text:
      'This week your decisions point toward a Drifting direction, with confidence trending {TrendWord}. The focus is split across a few areas, which can read as mixed signals in the entries. This label is descriptive, not evaluative. It simply reflects what the logged confidence suggests over time.',
    patternLine: 'Direction looks Drifting, and confidence has been trending down.',
  },
  {
    id: 'DRIFTING_GENERAL_1',
    conditions: { minCount: 3, directionStatus: ['DRIFTING'] },
    text:
      'This week your decisions point toward a Drifting direction. The confidence pattern has been {TrendWord} recently, which gives context without turning it into a story. In this app, drifting is simply a label for what the logged confidence and consistency suggest. It’s okay if you read it as “unclear” rather than “negative.”',
    patternLine: 'Direction looks Drifting based on the week’s logged decisions.',
  },

  {
    id: 'TREND_UP_OVERRIDE_1',
    conditions: { minCount: 3, confidenceTrend: ['UP'] },
    text:
      'One clear signal in this week’s log is that confidence has been trending up. That can happen even if the focus shifts between categories, and it doesn’t need to mean anything beyond what was recorded. The snapshot stays calm by design and doesn’t try to explain the cause. It simply notes the direction the numbers have been moving.',
    patternLine: 'Confidence has been trending up across the week’s entries.',
  },
  {
    id: 'TREND_DOWN_OVERRIDE_1',
    conditions: { minCount: 3, confidenceTrend: ['DOWN'] },
    text:
      'One clear signal in this week’s log is that confidence has been trending down. That can reflect mixed days, uneven decisions, or simply what was captured this week. The snapshot doesn’t interpret it as a problem—only as a pattern in the entries. It’s okay for the data to be descriptive without being directive.',
    patternLine: 'Confidence has been trending down across the week’s entries.',
  },
  {
    id: 'TREND_STEADY_OVERRIDE_1',
    conditions: { minCount: 3, confidenceTrend: ['STEADY'] },
    text:
      'One clear signal in this week’s log is that confidence has been holding steady. That steadiness can show up whether the week felt quiet or busy. This snapshot stays factual and leaves room for nuance beyond the entries. It’s simply reflecting what the logged confidence suggests over time.',
    patternLine: 'Confidence has been holding steady across the week’s entries.',
  },

  {
    id: 'FALLBACK_1',
    conditions: {},
    text:
      'This is a calm snapshot of what was logged this week. The pattern here is intentionally descriptive and avoids conclusions. If anything feels unclear, it may simply be a sign that the week held mixed signals. Over time, repeated entries make trends easier to see.',
    patternLine: 'This snapshot reflects only what was recorded.',
  },
];

function selectBaseTemplate(inputs: ReflectionInputs): ReflectionTemplate {
  if (inputs.decisionCount === 0) {
    return REFLECTION_TEMPLATES.find((t) => t.id === 'NO_DECISIONS_1') ?? REFLECTION_TEMPLATES[0];
  }

  if (inputs.decisionCount <= 2) {
    const lowDataOrder = ['LOW_DATA_1', 'LOW_DATA_2', 'LOW_DATA_3'];
    for (const id of lowDataOrder) {
      const t = REFLECTION_TEMPLATES.find((x) => x.id === id);
      if (t && matchesConditions(t, inputs)) return t;
    }
  }

  const directionOrder: Array<ReflectionInputs['directionStatus']> = ['GROWING', 'STABLE', 'DRIFTING'];
  if (directionOrder.includes(inputs.directionStatus)) {
    const candidates = REFLECTION_TEMPLATES.filter((t) => matchesConditions(t, inputs));
    const bySpecificity = [...candidates].sort((a, b) => {
      const score = (t: ReflectionTemplate): number => {
        const c = t.conditions;
        let s = 0;
        if (c.minCount !== undefined || c.maxCount !== undefined) s += 1;
        if (c.directionStatus) s += 3;
        if (c.confidenceTrend) s += 2;
        if (c.focusIsTie !== undefined) s += 2;
        if (c.hasFocusCategory !== undefined) s += 1;
        if (c.byCategoryKind) s += 2;
        if (c.hasByCategoryCategory !== undefined) s += 1;
        if (c.pace) s += 1;
        return s;
      };
      return score(b) - score(a);
    });

    const picked = bySpecificity[0];
    if (picked) return picked;
  }

  return REFLECTION_TEMPLATES.find((t) => t.id === 'FALLBACK_1') ?? REFLECTION_TEMPLATES[REFLECTION_TEMPLATES.length - 1];
}

export function selectReflection(inputs: ReflectionInputs): ReflectionTemplate {
  return selectBaseTemplate(inputs);
}

export function renderReflection(template: ReflectionTemplate, inputs: ReflectionInputs): {
  reflectionText: string;
  observedPatternText: string;
} {
  const useLimited = inputs.decisionCount > 0 && inputs.decisionCount <= 2 && template.limitedDataVariant;

  const text = useLimited ? template.limitedDataVariant!.text : template.text;
  const patternLine = useLimited ? template.limitedDataVariant!.patternLine : template.patternLine;

  return {
    reflectionText: applyPlaceholders({ text, inputs }).trim(),
    observedPatternText: applyPlaceholders({ text: patternLine, inputs }).trim(),
  };
}

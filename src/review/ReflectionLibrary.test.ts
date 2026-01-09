import { renderReflection, selectReflection, type ReflectionInputs } from './ReflectionLibrary';

describe('ReflectionLibrary selection', () => {
  test('decisionCount 0 -> NO_DECISIONS', () => {
    const inputs: ReflectionInputs = {
      decisionCount: 0,
      directionStatus: 'NO_SIGNAL',
      confidenceTrend: 'NA',
      decisionFocus: { focusCategory: null, isTie: true },
      confidenceByCategoryInsight: { kind: 'NONE', category: null },
      pace: 'NA',
    };

    const t = selectReflection(inputs);
    expect(t.id).toBe('NO_DECISIONS_1');
  });

  test('decisionCount 2 tie focus -> LOW_DATA tie template', () => {
    const inputs: ReflectionInputs = {
      decisionCount: 2,
      directionStatus: 'STABLE',
      confidenceTrend: 'NA',
      decisionFocus: { focusCategory: null, isTie: true },
      confidenceByCategoryInsight: { kind: 'NONE', category: null },
      pace: 'NA',
    };

    const t = selectReflection(inputs);
    expect(t.id).toBe('LOW_DATA_1');
  });

  test('GROWING + trend UP + clear focus -> growing trend-up focus template', () => {
    const inputs: ReflectionInputs = {
      decisionCount: 5,
      directionStatus: 'GROWING',
      confidenceTrend: 'UP',
      decisionFocus: { focusCategory: 'Work', isTie: false },
      confidenceByCategoryInsight: { kind: 'NONE', category: null },
      pace: 'NA',
    };

    const t = selectReflection(inputs);
    expect(t.id).toBe('GROWING_FOCUS_TREND_UP_1');
  });

  test('DRIFTING + trend DOWN + tie focus -> drifting split trend-down template', () => {
    const inputs: ReflectionInputs = {
      decisionCount: 6,
      directionStatus: 'DRIFTING',
      confidenceTrend: 'DOWN',
      decisionFocus: { focusCategory: null, isTie: true },
      confidenceByCategoryInsight: { kind: 'NONE', category: null },
      pace: 'NA',
    };

    const t = selectReflection(inputs);
    expect(t.id).toBe('DRIFTING_SPLIT_TREND_DOWN_1');
  });

  test('confidenceByCategory kind LESS inserts category safely', () => {
    const inputs: ReflectionInputs = {
      decisionCount: 6,
      directionStatus: 'DRIFTING',
      confidenceTrend: 'STEADY',
      decisionFocus: { focusCategory: null, isTie: true },
      confidenceByCategoryInsight: { kind: 'LESS', category: 'Health' },
      pace: 'NA',
    };

    const t = selectReflection(inputs);
    expect(t.id).toBe('DRIFTING_BYCAT_LESS_1');

    const rendered = renderReflection(t, inputs);
    expect(rendered.reflectionText).toContain('Health');
    expect(rendered.observedPatternText).toContain('Health');
  });
});

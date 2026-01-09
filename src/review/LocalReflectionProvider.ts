import {
  renderReflection,
  selectReflection,
  type ConfidenceByCategoryInsight,
  type ReflectionInputs,
} from './ReflectionLibrary';

export type LocalReflectionInputs = {
  decisionCount: number;
  directionStatus: 'NO_SIGNAL' | 'GROWING' | 'STABLE' | 'DRIFTING';
  confidenceTrend: 'UP' | 'DOWN' | 'STEADY' | 'NA';
  decisionFocus: {
    focusCategory: string | null;
    isTie: boolean;
  };
  confidenceByCategoryInsight: {
    kind: ConfidenceByCategoryInsight['kind'];
    category: string | null;
  };
  pace?: 'MORE' | 'FEWER' | 'TYPICAL' | 'NA';
};

export type LocalReflectionResult = {
  reflectionText: string;
  observedPatternText: string;
  gentleQuestionText: string | null;
};

export function generateReflection(inputs: LocalReflectionInputs): LocalReflectionResult {
  const libInputs: ReflectionInputs = {
    decisionCount: inputs.decisionCount,
    directionStatus: inputs.directionStatus,
    confidenceTrend: inputs.confidenceTrend,
    decisionFocus: {
      focusCategory: inputs.decisionFocus.focusCategory,
      isTie: inputs.decisionFocus.isTie,
    },
    confidenceByCategoryInsight: {
      kind: inputs.confidenceByCategoryInsight.kind,
      category: inputs.confidenceByCategoryInsight.category,
    },
    pace: inputs.pace,
  };

  const template = selectReflection(libInputs);
  const rendered = renderReflection(template, libInputs);

  return {
    reflectionText: rendered.reflectionText,
    observedPatternText: rendered.observedPatternText,
    gentleQuestionText: null,
  };
}

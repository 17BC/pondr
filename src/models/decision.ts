export type DecisionCategory =
  | 'career'
  | 'health'
  | 'relationships'
  | 'learning'
  | 'lifestyle'
  | 'money-choice'
  | 'other';

export type FeelingScore = 1 | 2 | 3 | 4 | 5;
export type ConfidenceScore = 1 | 2 | 3 | 4 | 5;

export type TradeoffGain = 'time' | 'energy' | 'growth' | 'peace' | 'fun';
export type TradeoffLoss = 'stress' | 'time' | 'flexibility' | 'pressure';

export type DirectionStatus = 'NO_SIGNAL' | 'GROWING' | 'STABLE' | 'DRIFTING';

export interface Decision {
  id: string;
  title: string;
  category: DecisionCategory;
  whyText?: string | null;
  feeling: FeelingScore;
  confidence: ConfidenceScore;
  tradeoffGains: TradeoffGain[];
  tradeoffLosses: TradeoffLoss[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface DecisionDraft {
  title: string;
  category: DecisionCategory;
  whyText?: string | null;
  feeling: FeelingScore;
  confidence: ConfidenceScore;
  tradeoffGains: TradeoffGain[];
  tradeoffLosses: TradeoffLoss[];
  tags: string[];
}

export interface WeeklySummary {
  weekStartAt: number;
  weekEndAt: number;
  decisionCount: number;
  avgConfidence: number;
  avgFeeling: number;
  topCategories: Array<{ category: DecisionCategory; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
  energyGainCount: number;
  energyDrainCount: number;
  direction: DirectionStatus;
}

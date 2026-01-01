import type { DecisionCategory, DirectionStatus } from '../models/decision';
import type { ConfidenceTrend } from '../confidence/confidence';

export type InsightCardType =
  | 'decision_focus'
  | 'confidence_by_category'
  | 'confidence_trend'
  | 'decision_pace'
  | 'direction_status'
  | 'repeated_choice_pattern';

export type InsightCardBase = {
  id: string;
  type: InsightCardType;
  title: string;
  copy: string;
};

export type DecisionFocusCard = InsightCardBase & {
  type: 'decision_focus';
  category: DecisionCategory;
};

export type ConfidenceByCategoryCard = InsightCardBase & {
  type: 'confidence_by_category';
  category: DecisionCategory;
  direction: 'more' | 'less';
};

export type ConfidenceTrendCard = InsightCardBase & {
  type: 'confidence_trend';
  trend: ConfidenceTrend;
};

export type DecisionPaceCard = InsightCardBase & {
  type: 'decision_pace';
  pace: 'more' | 'fewer';
};

export type DirectionStatusCard = InsightCardBase & {
  type: 'direction_status';
  status: DirectionStatus;
};

export type RepeatedChoicePatternCard = InsightCardBase & {
  type: 'repeated_choice_pattern';
};

export type InsightCard =
  | DecisionFocusCard
  | ConfidenceByCategoryCard
  | ConfidenceTrendCard
  | DecisionPaceCard
  | DirectionStatusCard
  | RepeatedChoicePatternCard;

export type InsightsSnapshot = {
  cards: InsightCard[];
};

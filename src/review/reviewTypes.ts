import type { DecisionCategory, DirectionStatus } from '../models/decision';

export type ConfidenceTrend = 'UP' | 'DOWN' | 'STEADY' | 'NA';

export type WeeklySnapshot = {
  weekId: string;
  weekStartAt: number;
  decisionsThisWeek: number;
  mostCommonCategory: DecisionCategory | null;
  confidenceTrend: ConfidenceTrend;
  directionStatus: DirectionStatus;
};

export type WeeklyReflection = {
  weekId: string;
  createdAt: number;
  reflection: string;
  observedPattern: string;
  question: string | null;
};

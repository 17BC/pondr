import { create } from 'zustand';

import type { DirectionStatus } from '../models/decision';
import type { ConfidenceTrend } from '../review/reviewTypes';
import { getHomeConfidenceSummary } from '../services/database/decisions';
import { getWeekStartDay } from '../settings/weekSettings';

type HomeMetrics = {
  weekDecisionCount: number;
  avgConfidence: number;
  direction: DirectionStatus;
  confidenceTrend: ConfidenceTrend;
};

type HomeMetricsState = {
  status: 'idle' | 'loading' | 'error';
  metrics: HomeMetrics;
  refresh: () => Promise<void>;
};

export const useHomeMetricsStore = create<HomeMetricsState>((set) => ({
  status: 'idle',
  metrics: {
    weekDecisionCount: 0,
    avgConfidence: 0,
    direction: 'NO_SIGNAL',
    confidenceTrend: 'NA',
  },
  refresh: async () => {
    set({ status: 'loading' });
    try {
      const weekStartDay = await getWeekStartDay();
      const metrics = await getHomeConfidenceSummary(Date.now(), weekStartDay);
      set({ metrics, status: 'idle' });
    } catch {
      set({ status: 'error' });
    }
  },
}));

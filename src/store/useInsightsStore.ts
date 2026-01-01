import { create } from 'zustand';

import { getInsightsSnapshot } from '../services/database/decisions';
import type { InsightsSnapshot } from '../insights/insightTypes';
import { getWeekStartDay } from '../settings/weekSettings';

type InsightsState = {
  status: 'idle' | 'loading' | 'error';
  data: InsightsSnapshot;
  refresh: () => Promise<void>;
};

export const useInsightsStore = create<InsightsState>((set) => ({
  status: 'idle',
  data: { cards: [] },
  refresh: async () => {
    set({ status: 'loading' });
    try {
      const weekStartDay = await getWeekStartDay();
      const data = await getInsightsSnapshot(Date.now(), weekStartDay);
      set({ data, status: 'idle' });
    } catch {
      set({ status: 'error' });
    }
  },
}));

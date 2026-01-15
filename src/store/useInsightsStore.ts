import { create } from 'zustand';

import { getInsightsSnapshot } from '../services/database/decisions';
import type { InsightsSnapshot } from '../insights/insightTypes';
import { getWeekStartDay } from '../settings/weekSettings';

type InsightsState = {
  status: 'idle' | 'loading' | 'error';
  data: InsightsSnapshot;
  nowMsOverride: number | null;
  setNowMsOverride: (nowMs: number | null) => void;
  refresh: () => Promise<void>;
};

export const useInsightsStore = create<InsightsState>((set) => ({
  status: 'idle',
  data: { cards: [] },
  nowMsOverride: null,
  setNowMsOverride: (nowMs) => set({ nowMsOverride: nowMs }),
  refresh: async () => {
    set({ status: 'loading' });
    try {
      const weekStartDay = await getWeekStartDay();
      const nowMs = useInsightsStore.getState().nowMsOverride ?? Date.now();
      const data = await getInsightsSnapshot(nowMs, weekStartDay);
      set({ data, status: 'idle' });
    } catch {
      set({ status: 'error' });
    }
  },
}));

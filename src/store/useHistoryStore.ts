import { create } from 'zustand';

import type { Decision } from '../models/decision';
import { listDecisions } from '../services/database/decisions';

type HistoryState = {
  status: 'idle' | 'loading' | 'error';
  items: Decision[];
  query: string;
  setQuery: (q: string) => void;
  refresh: () => Promise<void>;
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  status: 'idle',
  items: [],
  query: '',
  setQuery: (q) => set({ query: q }),
  refresh: async () => {
    set({ status: 'loading' });
    try {
      const { query } = get();
      const items = await listDecisions({ searchText: query, limit: 200 });
      set({ items, status: 'idle' });
    } catch {
      set({ status: 'error' });
    }
  },
}));

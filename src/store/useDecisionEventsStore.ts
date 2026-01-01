import { create } from 'zustand';

type DecisionEventsState = {
  saveVersion: number;
  lastSavedAt: number | null;
  savedBannerVisible: boolean;
  markSaved: () => void;
  dismissSavedBanner: () => void;
};

export const useDecisionEventsStore = create<DecisionEventsState>((set) => ({
  saveVersion: 0,
  lastSavedAt: null,
  savedBannerVisible: false,
  markSaved: () => {
    const now = Date.now();
    set((s) => ({ saveVersion: s.saveVersion + 1, lastSavedAt: now, savedBannerVisible: true }));
  },
  dismissSavedBanner: () => set({ savedBannerVisible: false }),
}));

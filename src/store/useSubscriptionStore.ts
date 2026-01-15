import { create } from 'zustand';

import { getStoredSubscription, setStoredSubscription } from '../storage/subscriptionStorage';

type SubscriptionState = {
  status: 'loading' | 'idle' | 'error';
  isSubscribed: boolean;
  currentPeriodEndAtMs: number | null;
  error: string | null;
  refresh: () => Promise<void>;
  subscribeDev: () => Promise<void>;
  cancelDev: () => Promise<void>;
};

function isActiveSubscription(input: { isSubscribed: boolean; currentPeriodEndAtMs: number | null; nowMs: number }): boolean {
  if (!input.isSubscribed) return false;
  if (input.currentPeriodEndAtMs === null) return true;
  return input.nowMs < input.currentPeriodEndAtMs;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  status: 'loading',
  isSubscribed: false,
  currentPeriodEndAtMs: null,
  error: null,

  refresh: async () => {
    set({ status: 'loading', error: null });
    try {
      const stored = await getStoredSubscription();
      if (!stored) {
        set({ status: 'idle', isSubscribed: false, currentPeriodEndAtMs: null });
        return;
      }

      const nowMs = Date.now();
      const active = isActiveSubscription({
        isSubscribed: stored.isSubscribed,
        currentPeriodEndAtMs: stored.currentPeriodEndAtMs,
        nowMs,
      });

      set({
        status: 'idle',
        isSubscribed: active,
        currentPeriodEndAtMs: stored.currentPeriodEndAtMs,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not load subscription status.';
      set({ status: 'error', error: message });
    }
  },

  subscribeDev: async () => {
    set({ error: null });
    try {
      const endAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      await setStoredSubscription({ isSubscribed: true, currentPeriodEndAtMs: endAt });
      set({ isSubscribed: true, currentPeriodEndAtMs: endAt });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update subscription.';
      set({ error: message });
    }
  },

  cancelDev: async () => {
    set({ error: null });
    try {
      const endAt = useSubscriptionStore.getState().currentPeriodEndAtMs;
      await setStoredSubscription({ isSubscribed: false, currentPeriodEndAtMs: endAt ?? null });
      set({ isSubscribed: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update subscription.';
      set({ error: message });
    }
  },
}));

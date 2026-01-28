import { create } from 'zustand';

import type { StoredEntitlement, SubscriptionTier } from '../storage/subscriptionStorage';
import {
  clearPlusContinuePending,
  clearStoredSubscription,
  getStoredSubscription,
  setPlusContinuePending,
  setStoredSubscription,
} from '../storage/subscriptionStorage';
import {
  revenueCatLogOutDev,
  revenueCatPurchasePlus,
  revenueCatRestorePurchases,
  revenueCatSyncEntitlement,
} from '../services/subscription/revenuecat';

type SubscriptionState = {
  status: 'loading' | 'idle' | 'error';
  subscriptionTier: SubscriptionTier;
  isSubscribed: boolean;
  currentPeriodEndAtMs: number | null;
  lastSyncedAtMs: number | null;
  source: StoredEntitlement['source'];
  error: string | null;
  refresh: () => Promise<void>;
  subscribe: () => Promise<void>;
  restore: () => Promise<void>;
  subscribeDev: () => Promise<void>;
  cancelDev: () => Promise<void>;
  resetDev: () => Promise<void>;
};

function isActiveSubscription(input: { isSubscribed: boolean; currentPeriodEndAtMs: number | null; nowMs: number }): boolean {
  if (!input.isSubscribed) return false;
  if (input.currentPeriodEndAtMs === null) return true;
  return input.nowMs < input.currentPeriodEndAtMs;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  status: 'loading',
  subscriptionTier: 'free',
  isSubscribed: false,
  currentPeriodEndAtMs: null,
  lastSyncedAtMs: null,
  source: 'unknown',
  error: null,

  refresh: async () => {
    set({ status: 'loading', error: null });
    try {
      const synced = await revenueCatSyncEntitlement();
      if (synced) {
        await setStoredSubscription(synced);
        const nowMs = Date.now();
        const active = isActiveSubscription({
          isSubscribed: synced.subscriptionTier === 'plus',
          currentPeriodEndAtMs: synced.currentPeriodEndAtMs,
          nowMs,
        });

        set({
          status: 'idle',
          subscriptionTier: active ? 'plus' : 'free',
          isSubscribed: active,
          currentPeriodEndAtMs: synced.currentPeriodEndAtMs,
          lastSyncedAtMs: synced.lastSyncedAtMs,
          source: synced.source,
        });
        return;
      }

      const stored = await getStoredSubscription();
      if (!stored) {
        set({
          status: 'idle',
          subscriptionTier: 'free',
          isSubscribed: false,
          currentPeriodEndAtMs: null,
          lastSyncedAtMs: null,
          source: 'unknown',
        });
        return;
      }

      const nowMs = Date.now();
      const active = isActiveSubscription({
        isSubscribed: stored.subscriptionTier === 'plus',
        currentPeriodEndAtMs: stored.currentPeriodEndAtMs,
        nowMs,
      });

      set({
        status: 'idle',
        subscriptionTier: active ? 'plus' : 'free',
        isSubscribed: active,
        currentPeriodEndAtMs: stored.currentPeriodEndAtMs,
        lastSyncedAtMs: stored.lastSyncedAtMs,
        source: stored.source,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not load subscription status.';
      set({ status: 'error', error: message });
    }
  },

  subscribe: async () => {
    const current = useSubscriptionStore.getState();
    if (current.isSubscribed) return;

    set({ status: 'loading', error: null });
    try {
      const purchased = await revenueCatPurchasePlus();
      if (purchased) {
        await setStoredSubscription(purchased);
        await setPlusContinuePending(true);
        set({ status: 'idle' });
        await useSubscriptionStore.getState().refresh();
        return;
      }

      set({ status: 'idle' });
      await current.subscribeDev();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not start subscription.';
      set({ status: 'error', error: message });
    }
  },

  restore: async () => {
    set({ status: 'loading', error: null });
    try {
      const restored = await revenueCatRestorePurchases();
      if (restored) {
        await setStoredSubscription(restored);
        await clearPlusContinuePending();
      }

      set({ status: 'idle' });
      await useSubscriptionStore.getState().refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not restore purchases.';
      set({ status: 'error', error: message });
    }
  },

  subscribeDev: async () => {
    set({ error: null });
    try {
      const endAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const entitlement: StoredEntitlement = {
        subscriptionTier: 'plus',
        currentPeriodEndAtMs: endAt,
        lastSyncedAtMs: Date.now(),
        source: 'local_dev',
      };
      await setStoredSubscription(entitlement);
      set({
        subscriptionTier: 'plus',
        isSubscribed: true,
        currentPeriodEndAtMs: endAt,
        lastSyncedAtMs: entitlement.lastSyncedAtMs,
        source: entitlement.source,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update subscription.';
      set({ error: message });
    }
  },

  cancelDev: async () => {
    set({ error: null });
    try {
      const endAt = useSubscriptionStore.getState().currentPeriodEndAtMs;
      const entitlement: StoredEntitlement = {
        subscriptionTier: 'free',
        currentPeriodEndAtMs: endAt ?? null,
        lastSyncedAtMs: Date.now(),
        source: 'local_dev',
      };
      await setStoredSubscription(entitlement);
      set({
        subscriptionTier: 'free',
        isSubscribed: false,
        lastSyncedAtMs: entitlement.lastSyncedAtMs,
        source: entitlement.source,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not update subscription.';
      set({ error: message });
    }
  },

  resetDev: async () => {
    set({ error: null });
    try {
      if (__DEV__) {
        await revenueCatLogOutDev();
      }
      await clearStoredSubscription();
      await clearPlusContinuePending();
      set({
        status: 'idle',
        subscriptionTier: 'free',
        isSubscribed: false,
        currentPeriodEndAtMs: null,
        lastSyncedAtMs: null,
        source: 'unknown',
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not reset subscription.';
      set({ error: message });
    }
  },
}));

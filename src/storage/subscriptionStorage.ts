import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionTier = 'free' | 'plus';

export type StoredEntitlement = {
  subscriptionTier: SubscriptionTier;
  currentPeriodEndAtMs: number | null;
  lastSyncedAtMs: number | null;
  source: 'local_dev' | 'revenuecat_sandbox' | 'unknown';
};

const SUBSCRIPTION_KEY = '@cnsdr_subscription';
const PLUS_CONTINUE_KEY = '@cnsdr_plus_continue_pending';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function coerceEndAtMs(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'number') return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

function coerceLastSyncedAtMs(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'number') return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

function coerceTier(value: unknown): SubscriptionTier | null {
  if (value === 'free' || value === 'plus') return value;
  return null;
}

function coerceSource(value: unknown): StoredEntitlement['source'] {
  if (value === 'local_dev' || value === 'revenuecat_sandbox' || value === 'unknown') return value;
  return 'unknown';
}

export async function getStoredSubscription(): Promise<StoredEntitlement | null> {
  const raw = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;

    const tier = coerceTier(parsed.subscriptionTier);
    const endAtMs = coerceEndAtMs(parsed.currentPeriodEndAtMs);
    const lastSyncedAtMs = coerceLastSyncedAtMs(parsed.lastSyncedAtMs);
    const source = coerceSource(parsed.source);

    if (tier) {
      return {
        subscriptionTier: tier,
        currentPeriodEndAtMs: endAtMs,
        lastSyncedAtMs,
        source,
      } satisfies StoredEntitlement;
    }

    const legacyIsSubscribed = parsed.isSubscribed;
    if (typeof legacyIsSubscribed !== 'boolean') return null;

    return {
      subscriptionTier: legacyIsSubscribed ? 'plus' : 'free',
      currentPeriodEndAtMs: endAtMs,
      lastSyncedAtMs: null,
      source: 'unknown',
    } satisfies StoredEntitlement;
  } catch {
    return null;
  }
}

export async function setStoredSubscription(input: StoredEntitlement): Promise<void> {
  await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(input));
}

export async function clearStoredSubscription(): Promise<void> {
  await AsyncStorage.removeItem(SUBSCRIPTION_KEY);
}

export async function getPlusContinuePending(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(PLUS_CONTINUE_KEY);
  return raw === '1';
}

export async function setPlusContinuePending(value: boolean): Promise<void> {
  await AsyncStorage.setItem(PLUS_CONTINUE_KEY, value ? '1' : '0');
}

export async function clearPlusContinuePending(): Promise<void> {
  await AsyncStorage.removeItem(PLUS_CONTINUE_KEY);
}

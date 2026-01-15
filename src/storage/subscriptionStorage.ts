import AsyncStorage from '@react-native-async-storage/async-storage';

type StoredSubscription = {
  isSubscribed: boolean;
  currentPeriodEndAtMs: number | null;
};

const SUBSCRIPTION_KEY = '@cnsdr_subscription';

export async function getStoredSubscription(): Promise<StoredSubscription | null> {
  const raw = await AsyncStorage.getItem(SUBSCRIPTION_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as any;

    if (typeof obj.isSubscribed !== 'boolean') return null;

    const end = obj.currentPeriodEndAtMs;
    if (end !== null && end !== undefined && typeof end !== 'number') return null;

    return {
      isSubscribed: obj.isSubscribed,
      currentPeriodEndAtMs: typeof end === 'number' && Number.isFinite(end) ? end : null,
    } satisfies StoredSubscription;
  } catch {
    return null;
  }
}

export async function setStoredSubscription(input: StoredSubscription): Promise<void> {
  await AsyncStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(input));
}

export async function clearStoredSubscription(): Promise<void> {
  await AsyncStorage.removeItem(SUBSCRIPTION_KEY);
}

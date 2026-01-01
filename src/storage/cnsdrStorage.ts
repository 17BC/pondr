import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETE_KEY = '@cnsdr_onboarding_complete';
const VALUES_KEY = '@cnsdr_values';

const LEGACY_ONBOARDING_COMPLETE_KEY = '@consdr_onboarding_complete';
const LEGACY_VALUES_KEY = '@consdr_values';

export async function getOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  if (value !== null) return value === 'true';

  const legacy = await AsyncStorage.getItem(LEGACY_ONBOARDING_COMPLETE_KEY);
  if (legacy !== null) {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, legacy);
    return legacy === 'true';
  }

  return false;
}

export async function setOnboardingComplete(complete: boolean): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, complete ? 'true' : 'false');
}

export async function getValues(): Promise<string[]> {
  let raw = await AsyncStorage.getItem(VALUES_KEY);

  if (!raw) {
    const legacy = await AsyncStorage.getItem(LEGACY_VALUES_KEY);
    if (legacy) {
      await AsyncStorage.setItem(VALUES_KEY, legacy);
      raw = legacy;
    }
  }

  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export async function setValues(values: string[]): Promise<void> {
  await AsyncStorage.setItem(VALUES_KEY, JSON.stringify(values));
}

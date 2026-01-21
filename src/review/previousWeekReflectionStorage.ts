import AsyncStorage from '@react-native-async-storage/async-storage';

type PreviousWeekReflectionCache = {
  windowStartIso: string;
  windowEndIso: string;
  generatedAtIso: string;
  reflectionText: string;
};

const PREVIOUS_WEEK_REFLECTION_KEY = '@cnsdr_previous_week_reflection';

export async function getPreviousWeekReflectionCache(): Promise<PreviousWeekReflectionCache | null> {
  const raw = await AsyncStorage.getItem(PREVIOUS_WEEK_REFLECTION_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as any;

    if (
      typeof obj.windowStartIso !== 'string' ||
      typeof obj.windowEndIso !== 'string' ||
      typeof obj.generatedAtIso !== 'string' ||
      typeof obj.reflectionText !== 'string'
    ) {
      return null;
    }

    return {
      windowStartIso: obj.windowStartIso,
      windowEndIso: obj.windowEndIso,
      generatedAtIso: obj.generatedAtIso,
      reflectionText: obj.reflectionText,
    } satisfies PreviousWeekReflectionCache;
  } catch {
    return null;
  }
}

export async function setPreviousWeekReflectionCache(input: PreviousWeekReflectionCache): Promise<void> {
  await AsyncStorage.setItem(PREVIOUS_WEEK_REFLECTION_KEY, JSON.stringify(input));
}

export async function clearPreviousWeekReflectionCache(): Promise<void> {
  await AsyncStorage.removeItem(PREVIOUS_WEEK_REFLECTION_KEY);
}

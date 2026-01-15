import AsyncStorage from '@react-native-async-storage/async-storage';

type PreviousWeekReflectionCache = {
  weekStartIso: string;
  weekEndIso: string;
  generatedAtIso: string;
  reflectionText: string;
  observedPatternText: string;
  gentleQuestionText: string | null;
};

const PREVIOUS_WEEK_REFLECTION_KEY = '@cnsdr_previous_week_reflection';

export async function getPreviousWeekReflectionCache(): Promise<PreviousWeekReflectionCache | null> {
  const raw = await AsyncStorage.getItem(PREVIOUS_WEEK_REFLECTION_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as any;

    if (typeof obj.weekStartIso !== 'string') return null;
    if (typeof obj.weekEndIso !== 'string') return null;
    if (typeof obj.generatedAtIso !== 'string') return null;
    if (typeof obj.reflectionText !== 'string') return null;
    if (typeof obj.observedPatternText !== 'string') return null;

    if (obj.gentleQuestionText !== null && obj.gentleQuestionText !== undefined && typeof obj.gentleQuestionText !== 'string') {
      return null;
    }

    return {
      weekStartIso: obj.weekStartIso,
      weekEndIso: obj.weekEndIso,
      generatedAtIso: obj.generatedAtIso,
      reflectionText: obj.reflectionText,
      observedPatternText: obj.observedPatternText,
      gentleQuestionText: obj.gentleQuestionText ?? null,
    } satisfies PreviousWeekReflectionCache;
  } catch {
    return null;
  }
}

export async function setPreviousWeekReflectionCache(input: PreviousWeekReflectionCache): Promise<void> {
  await AsyncStorage.setItem(PREVIOUS_WEEK_REFLECTION_KEY, JSON.stringify(input));
}

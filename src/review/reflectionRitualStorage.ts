import AsyncStorage from '@react-native-async-storage/async-storage';

export type RollingReflectionCache = {
  windowStart: string;
  windowEnd: string;
  generatedAt: string;
  reflectionText: string;
  observedPatternText: string;
  gentleQuestionText: string | null;
};

const FIRST_APP_USE_AT_KEY = '@cnsdr_first_app_use_at';
const LAST_REFLECTION_AT_KEY = '@cnsdr_last_reflection_at';
const REFLECTION_CACHE_KEY = '@cnsdr_reflection_cache_rolling';

export async function getFirstAppUseAt(): Promise<string | null> {
  const v = await AsyncStorage.getItem(FIRST_APP_USE_AT_KEY);
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? v : null;
}

export async function ensureFirstAppUseAt(nowMs: number = Date.now()): Promise<string> {
  const existing = await getFirstAppUseAt();
  if (existing) return existing;
  const iso = new Date(nowMs).toISOString();
  await AsyncStorage.setItem(FIRST_APP_USE_AT_KEY, iso);
  return iso;
}

export async function getLastReflectionAt(): Promise<string | null> {
  const v = await AsyncStorage.getItem(LAST_REFLECTION_AT_KEY);
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? v : null;
}

export async function setLastReflectionAt(iso: string): Promise<void> {
  await AsyncStorage.setItem(LAST_REFLECTION_AT_KEY, iso);
}

export async function getRollingReflectionCache(): Promise<RollingReflectionCache | null> {
  const raw = await AsyncStorage.getItem(REFLECTION_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as any;

    if (
      typeof obj.windowStart !== 'string' ||
      typeof obj.windowEnd !== 'string' ||
      typeof obj.generatedAt !== 'string' ||
      typeof obj.reflectionText !== 'string' ||
      typeof obj.observedPatternText !== 'string'
    ) {
      return null;
    }

    if (obj.gentleQuestionText !== null && obj.gentleQuestionText !== undefined && typeof obj.gentleQuestionText !== 'string') {
      return null;
    }

    const ws = new Date(obj.windowStart);
    const we = new Date(obj.windowEnd);
    const ga = new Date(obj.generatedAt);
    if (!Number.isFinite(ws.getTime()) || !Number.isFinite(we.getTime()) || !Number.isFinite(ga.getTime())) return null;

    return {
      windowStart: obj.windowStart,
      windowEnd: obj.windowEnd,
      generatedAt: obj.generatedAt,
      reflectionText: obj.reflectionText,
      observedPatternText: obj.observedPatternText,
      gentleQuestionText: obj.gentleQuestionText ?? null,
    } satisfies RollingReflectionCache;
  } catch {
    return null;
  }
}

export async function setRollingReflectionCache(cache: RollingReflectionCache): Promise<void> {
  await AsyncStorage.setItem(REFLECTION_CACHE_KEY, JSON.stringify(cache));
}

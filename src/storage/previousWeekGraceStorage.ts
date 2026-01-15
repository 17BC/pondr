import AsyncStorage from '@react-native-async-storage/async-storage';

type PreviousWeekGrace = {
  used: boolean;
  usedAtIso: string | null;
};

const PREVIOUS_WEEK_GRACE_KEY = '@cnsdr_previous_week_grace';

export async function getPreviousWeekGrace(): Promise<PreviousWeekGrace> {
  const raw = await AsyncStorage.getItem(PREVIOUS_WEEK_GRACE_KEY);
  if (!raw) return { used: false, usedAtIso: null };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { used: false, usedAtIso: null };
    const obj = parsed as any;

    if (typeof obj.used !== 'boolean') return { used: false, usedAtIso: null };
    if (obj.usedAtIso !== null && obj.usedAtIso !== undefined && typeof obj.usedAtIso !== 'string') {
      return { used: obj.used, usedAtIso: null };
    }

    return { used: obj.used, usedAtIso: obj.usedAtIso ?? null } satisfies PreviousWeekGrace;
  } catch {
    return { used: false, usedAtIso: null };
  }
}

export async function setPreviousWeekGrace(input: PreviousWeekGrace): Promise<void> {
  await AsyncStorage.setItem(PREVIOUS_WEEK_GRACE_KEY, JSON.stringify(input));
}

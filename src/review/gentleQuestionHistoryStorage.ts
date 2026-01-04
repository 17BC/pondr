import AsyncStorage from '@react-native-async-storage/async-storage';

const GENTLE_QUESTION_HISTORY_KEY = '@cnsdr_gentle_question_history_v1';

export type GentleQuestionHistory = {
  lastUsedQuestionIds: string[];
};

export async function getGentleQuestionHistory(): Promise<GentleQuestionHistory> {
  const raw = await AsyncStorage.getItem(GENTLE_QUESTION_HISTORY_KEY);
  if (!raw) return { lastUsedQuestionIds: [] };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { lastUsedQuestionIds: [] };
    const obj = parsed as any;

    if (!Array.isArray(obj.lastUsedQuestionIds)) return { lastUsedQuestionIds: [] };
    const cleaned = obj.lastUsedQuestionIds.filter((x: unknown) => typeof x === 'string');

    return { lastUsedQuestionIds: cleaned } satisfies GentleQuestionHistory;
  } catch {
    return { lastUsedQuestionIds: [] };
  }
}

export async function setGentleQuestionHistory(history: GentleQuestionHistory): Promise<void> {
  await AsyncStorage.setItem(GENTLE_QUESTION_HISTORY_KEY, JSON.stringify(history));
}

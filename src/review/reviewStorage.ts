import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WeeklyReflection } from './reviewTypes';

function keyForWeek(weekId: string): string {
  return `@cnsdr_review_reflection_${weekId}`;
}

export async function getWeeklyReflection(weekId: string): Promise<WeeklyReflection | null> {
  const raw = await AsyncStorage.getItem(keyForWeek(weekId));
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const obj = parsed as any;
    if (
      typeof obj.weekId !== 'string' ||
      typeof obj.createdAt !== 'number' ||
      typeof obj.reflection !== 'string' ||
      typeof obj.observedPattern !== 'string'
    ) {
      return null;
    }

    if (obj.question !== null && obj.question !== undefined && typeof obj.question !== 'string') {
      return null;
    }

    return {
      weekId: obj.weekId,
      createdAt: obj.createdAt,
      reflection: obj.reflection,
      observedPattern: obj.observedPattern,
      question: obj.question ?? null,
    } satisfies WeeklyReflection;
  } catch {
    return null;
  }
}

export async function setWeeklyReflection(input: WeeklyReflection): Promise<void> {
  await AsyncStorage.setItem(keyForWeek(input.weekId), JSON.stringify(input));
}

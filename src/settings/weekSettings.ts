import AsyncStorage from '@react-native-async-storage/async-storage';

// JS Date.getDay(): 0=Sun ... 6=Sat
export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const WEEK_START_DAY_KEY = '@cnsdr_week_start_day';
const DEFAULT_WEEK_START_DAY: WeekStartDay = 1; // Monday

export function isWeekStartDay(n: number): n is WeekStartDay {
  return n === 0 || n === 1 || n === 2 || n === 3 || n === 4 || n === 5 || n === 6;
}

export async function getWeekStartDay(): Promise<WeekStartDay> {
  const raw = await AsyncStorage.getItem(WEEK_START_DAY_KEY);
  if (!raw) return DEFAULT_WEEK_START_DAY;
  const n = Number(raw);
  return isWeekStartDay(n) ? n : DEFAULT_WEEK_START_DAY;
}

export async function setWeekStartDay(day: WeekStartDay): Promise<void> {
  await AsyncStorage.setItem(WEEK_START_DAY_KEY, String(day));
}

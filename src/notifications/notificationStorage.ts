import AsyncStorage from '@react-native-async-storage/async-storage';

const REFLECTION_WEEK_KEY = '@cnsdr_notification_reflection_week_key';
const LOGGING_WEEK_KEY = '@cnsdr_notification_logging_week_key';
const REFLECTION_SCHEDULED_ID_KEY = '@cnsdr_notification_reflection_scheduled_id';
const LOGGING_SCHEDULED_ID_KEY = '@cnsdr_notification_logging_scheduled_id';

export async function getReflectionNotificationWeekKey(): Promise<string | null> {
  return (await AsyncStorage.getItem(REFLECTION_WEEK_KEY)) ?? null;
}

export async function setReflectionNotificationWeekKey(weekKey: string): Promise<void> {
  await AsyncStorage.setItem(REFLECTION_WEEK_KEY, weekKey);
}

export async function getLoggingNotificationWeekKey(): Promise<string | null> {
  return (await AsyncStorage.getItem(LOGGING_WEEK_KEY)) ?? null;
}

export async function setLoggingNotificationWeekKey(weekKey: string): Promise<void> {
  await AsyncStorage.setItem(LOGGING_WEEK_KEY, weekKey);
}

export async function getReflectionScheduledNotificationId(): Promise<string | null> {
  return (await AsyncStorage.getItem(REFLECTION_SCHEDULED_ID_KEY)) ?? null;
}

export async function setReflectionScheduledNotificationId(id: string | null): Promise<void> {
  if (!id) {
    await AsyncStorage.removeItem(REFLECTION_SCHEDULED_ID_KEY);
    return;
  }
  await AsyncStorage.setItem(REFLECTION_SCHEDULED_ID_KEY, id);
}

export async function getLoggingScheduledNotificationId(): Promise<string | null> {
  return (await AsyncStorage.getItem(LOGGING_SCHEDULED_ID_KEY)) ?? null;
}

export async function setLoggingScheduledNotificationId(id: string | null): Promise<void> {
  if (!id) {
    await AsyncStorage.removeItem(LOGGING_SCHEDULED_ID_KEY);
    return;
  }
  await AsyncStorage.setItem(LOGGING_SCHEDULED_ID_KEY, id);
}

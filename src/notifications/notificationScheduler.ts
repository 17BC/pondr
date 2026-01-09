import * as Notifications from 'expo-notifications';

import { getCurrentWeekRange } from '../confidence/confidence';
import { getWeekStartDay } from '../settings/weekSettings';
import { getDecisionCountInRange, getLastDecisionCreatedAt } from '../services/database/decisions';
import { getRollingReflectionCache, getFirstAppUseAt, getLastReflectionAt } from '../review/reflectionRitualStorage';
import { daysUntilNextUnlock } from '../review/reflectionUnlock';
import { GENTLE_LOGGING_NOTIFICATION, WEEKLY_REFLECTION_NOTIFICATION } from './notificationCopy';
import {
  getLoggingNotificationWeekKey,
  getReflectionNotificationWeekKey,
  getLoggingScheduledNotificationId,
  getReflectionScheduledNotificationId,
  setLoggingNotificationWeekKey,
  setLoggingScheduledNotificationId,
  setReflectionNotificationWeekKey,
  setReflectionScheduledNotificationId,
} from './notificationStorage';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function startOfDayMs(nowMs: number): number {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function weekKeyFromRange(range: { start: Date; end: Date }): string {
  // Stable local-week key based on the configured week start (local time).
  const d = range.start;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isLastDayOfWeek(nowMs: number, weekStartDay: number): boolean {
  const week = getCurrentWeekRange(nowMs, weekStartDay);
  const weekEndMs = week.end.getTime();
  const lastDayStartMs = startOfDayMs(weekEndMs - MS_PER_DAY);
  const todayStartMs = startOfDayMs(nowMs);
  return todayStartMs >= lastDayStartMs && todayStartMs < weekEndMs;
}

function scheduleTimeThisEvening(nowMs: number, hour: number = 19): Date | null {
  const d = new Date(nowMs);
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() <= nowMs) return null;
  return d;
}

function secondsUntil(target: Date, nowMs: number): number | null {
  const diffMs = target.getTime() - nowMs;
  if (diffMs <= 0) return null;
  return Math.ceil(diffMs / 1000);
}

async function cancelIfScheduled(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // If the OS already cleared it, ignore.
  }
}

export async function cancelPendingCalmNotifications(): Promise<void> {
  const reflectionId = await getReflectionScheduledNotificationId();
  const loggingId = await getLoggingScheduledNotificationId();
  await cancelIfScheduled(reflectionId);
  await cancelIfScheduled(loggingId);
  await setReflectionScheduledNotificationId(null);
  await setLoggingScheduledNotificationId(null);
}

async function ensurePermissions(): Promise<boolean> {
  // Calm-by-default: only schedule if the OS already allows it (or the user grants it).
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function scheduleDevTestNotification(delaySeconds: number = 60): Promise<void> {
  if (!__DEV__) return;

  const ok = await ensurePermissions();
  if (!ok) return;

  const seconds = Math.max(5, Math.floor(delaySeconds));

  await Notifications.scheduleNotificationAsync({
    content: {
      title: GENTLE_LOGGING_NOTIFICATION.title,
      body: GENTLE_LOGGING_NOTIFICATION.body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
}

async function shouldSendWeeklyReflectionReminder(input: {
  nowMs: number;
  weekStartDay: number;
  weekStartAt: number;
  weekEndAt: number;
  decisionsThisWeek: number;
  weekKey: string;
}): Promise<boolean> {
  if (!isLastDayOfWeek(input.nowMs, input.weekStartDay)) return false;
  if (input.decisionsThisWeek < 1) return false;

  const already = await getReflectionNotificationWeekKey();
  if (already === input.weekKey) return false;

  const cache = await getRollingReflectionCache();
  const cacheInWindow =
    cache &&
    new Date(cache.generatedAt).getTime() >= input.weekStartAt &&
    new Date(cache.generatedAt).getTime() <= input.weekEndAt;
  if (cacheInWindow) return false;

  // "Reflection is available": match the Generate button being truly unlockable.
  const firstUseIso = await getFirstAppUseAt();
  const lastReflectionIso = await getLastReflectionAt();
  const anchor = lastReflectionIso ?? firstUseIso;
  const timeUnlocked = daysUntilNextUnlock(anchor, 7, input.nowMs) === 0;
  if (!timeUnlocked) return false;

  return true;
}

async function shouldSendGentleLoggingReminder(input: {
  nowMs: number;
  weekStartDay: number;
  weekKey: string;
}): Promise<boolean> {
  if (isLastDayOfWeek(input.nowMs, input.weekStartDay)) return false;

  const already = await getLoggingNotificationWeekKey();
  if (already === input.weekKey) return false;

  const lastAt = await getLastDecisionCreatedAt();
  if (!lastAt) {
    const firstUseIso = await getFirstAppUseAt();
    if (!firstUseIso) return false;
    const firstUseMs = new Date(firstUseIso).getTime();
    if (!Number.isFinite(firstUseMs)) return false;
    const daysSinceFirstUse = (input.nowMs - firstUseMs) / MS_PER_DAY;
    return daysSinceFirstUse >= 3.5;
  }

  const daysSince = (input.nowMs - lastAt) / MS_PER_DAY;
  return daysSince >= 3.5;
}

export async function scheduleCalmNotifications(nowMs: number = Date.now()): Promise<void> {
  const ok = await ensurePermissions();
  if (!ok) return;

  const weekStartDay = await getWeekStartDay();
  const weekRange = getCurrentWeekRange(nowMs, weekStartDay);
  const weekKey = weekKeyFromRange(weekRange);

  const weekStartAt = weekRange.start.getTime();
  const weekEndAt = weekRange.end.getTime();
  const decisionsThisWeek = await getDecisionCountInRange(weekStartAt, weekEndAt);

  // Calm philosophy: at most one notification per day, with reflection-day taking priority.
  const reflectionEligible = await shouldSendWeeklyReflectionReminder({
    nowMs,
    weekStartDay,
    weekStartAt,
    weekEndAt,
    decisionsThisWeek,
    weekKey,
  });

  const when = scheduleTimeThisEvening(nowMs, 19);
  if (!when) return;
  const seconds = secondsUntil(when, nowMs);
  if (!seconds) return;

  const existingReflectionId = await getReflectionScheduledNotificationId();
  const existingLoggingId = await getLoggingScheduledNotificationId();

  if (reflectionEligible) {
    // Only one calm nudge per evening. If we had scheduled a logging reminder, cancel it.
    await cancelIfScheduled(existingLoggingId);
    await setLoggingScheduledNotificationId(null);

    if (existingReflectionId) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: WEEKLY_REFLECTION_NOTIFICATION.title,
        body: WEEKLY_REFLECTION_NOTIFICATION.body,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
    }).then(setReflectionScheduledNotificationId);
    await setReflectionNotificationWeekKey(weekKey);
    return;
  }

  const loggingEligible = await shouldSendGentleLoggingReminder({ nowMs, weekStartDay, weekKey });
  if (!loggingEligible) return;

  // If we had scheduled a reflection reminder, cancel it (e.g., reflection got generated).
  await cancelIfScheduled(existingReflectionId);
  await setReflectionScheduledNotificationId(null);

  if (existingLoggingId) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: GENTLE_LOGGING_NOTIFICATION.title,
      body: GENTLE_LOGGING_NOTIFICATION.body,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
  }).then(setLoggingScheduledNotificationId);
  await setLoggingNotificationWeekKey(weekKey);
}

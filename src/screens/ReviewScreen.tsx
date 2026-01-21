import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton } from '../components/common/AppButton';
import { Card } from '../components/common/Card';
import { DirectionStatusBadge } from '../components/decision/DirectionStatusBadge';
import { colors } from '../theme/colors';
import { useDecisionEventsStore } from '../store/useDecisionEventsStore';
import { getWeeklyReviewDetail } from '../services/database/decisions';
import { categoryLabel } from '../utils/categoryLabel';
import { directionStatusCopy } from '../confidence/confidence';
import { generateRollingReflection } from '../services/ai/reviewReflection';
import { composeWeeklyReflection } from '../review/ReflectionComposer';
import {
  ensureFirstAppUseAt,
  getLastReflectionAt,
  getRollingReflectionCache,
  setLastReflectionAt,
  setRollingReflectionCache,
} from '../review/reflectionRitualStorage';
import { getReviewUnlockState } from '../review/reflectionUnlock';
import { confidenceTrendCopy, getCurrentWeekRange, getPreviousWeekRange } from '../confidence/confidence';
import { getWeekStartDay } from '../settings/weekSettings';
import type { TabParamList } from '../navigation/types';
import type { MainStackParamList } from '../navigation/types';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { getOrCreateInstallId } from '../storage/installIdStorage';
import { getPreviousWeekGrace, setPreviousWeekGrace } from '../storage/previousWeekGraceStorage';
import { getPreviousWeekReflectionCache, setPreviousWeekReflectionCache } from '../review/previousWeekReflectionStorage';

export function ReviewScreen(): React.JSX.Element {
  const c = colors.light;
  const navigation = useNavigation<
    CompositeNavigationProp<BottomTabNavigationProp<TabParamList>, NativeStackNavigationProp<MainStackParamList>>
  >();
  const route = useRoute<RouteProp<TabParamList, 'Review'>>();

  const saveVersion = useDecisionEventsStore((s) => s.saveVersion);
  const isSubscribed = useSubscriptionStore((s) => s.isSubscribed);

  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [snapshot, setSnapshot] = useState<
    | (Awaited<ReturnType<typeof getWeeklyReviewDetail>> & { windowStartIso: string; windowEndIso: string })
    | null
  >(null);
  const [reflection, setReflection] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [previousWeekReflection, setPreviousWeekReflection] = useState<string | null>(null);
  const [previousWeekUsed, setPreviousWeekUsed] = useState<boolean>(false);
  const [generatingPreviousWeek, setGeneratingPreviousWeek] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstAppUseAtIso, setFirstAppUseAtIso] = useState<string | null>(null);
  const [lastReflectionAtIso, setLastReflectionAtIso] = useState<string | null>(null);
  const [cachedGeneratedAtIso, setCachedGeneratedAtIso] = useState<string | null>(null);
  const [weekStartDay, setWeekStartDay] = useState<number>(1);

  const refresh = async (): Promise<void> => {
    setStatus('loading');
    setError(null);
    try {
      await useSubscriptionStore.getState().refresh();
      const nowMs = Date.now();
      const firstUse = await ensureFirstAppUseAt(nowMs);
      const lastAt = await getLastReflectionAt();
      const cache = await getRollingReflectionCache();
      const prevGrace = await getPreviousWeekGrace();
      const prevCache = await getPreviousWeekReflectionCache();

      const weekStartDay = await getWeekStartDay();
      setWeekStartDay(weekStartDay);
      const s = await getWeeklyReviewDetail(nowMs, weekStartDay);

      setFirstAppUseAtIso(firstUse);
      setLastReflectionAtIso(lastAt);
      setCachedGeneratedAtIso(cache?.generatedAt ?? null);
      setPreviousWeekUsed(prevGrace.used);

      const prevWeek = getPreviousWeekRange(nowMs, weekStartDay);
      const prevStartIso = prevWeek.start.toISOString();
      const prevEndIso = prevWeek.end.toISOString();
      const prevCacheMatchesWindow = prevCache && prevCache.windowStartIso === prevStartIso && prevCache.windowEndIso === prevEndIso;
      setPreviousWeekReflection(prevCacheMatchesWindow ? prevCache.reflectionText : null);

      setSnapshot({
        ...s,
        windowStartIso: new Date(s.windowStartAt).toISOString(),
        windowEndIso: new Date(s.windowEndAt).toISOString(),
      });

      const windowStartMs = s.windowStartAt;
      const windowEndMs = s.windowEndAt;
      const cacheIsForWindow =
        cache && new Date(cache.generatedAt).getTime() >= windowStartMs && new Date(cache.generatedAt).getTime() <= windowEndMs;

      const week = getCurrentWeekRange(nowMs, weekStartDay);
      const startOfLastDayMs = new Date(week.end.getTime() - 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0);
      const todayStartMs = new Date(nowMs).setHours(0, 0, 0, 0);
      const isLastDayOfWeek = todayStartMs >= startOfLastDayMs && todayStartMs < week.end.getTime();

      if (cacheIsForWindow && isLastDayOfWeek) {
        setReflection(cache.reflectionText);
      } else {
        setReflection(null);
      }
      setStatus('idle');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not load your weekly review.';
      setError(message);
      setStatus('error');
    }
  };

  const canGeneratePreviousWeek = useMemo(() => {
    return isSubscribed && !generatingPreviousWeek && !previousWeekUsed && snapshot !== null;
  }, [generatingPreviousWeek, isSubscribed, previousWeekUsed, snapshot]);

  const onGeneratePreviousWeek = async (): Promise<void> => {
    if (generatingPreviousWeek) return;
    if (!isSubscribed) return;
    if (previousWeekUsed) return;

    setGeneratingPreviousWeek(true);
    setError(null);
    try {
      const nowMs = Date.now();
      const prevWeekNowMs = nowMs - 7 * 24 * 60 * 60 * 1000;
      const weekStartDay = await getWeekStartDay();

      const s = await getWeeklyReviewDetail(prevWeekNowMs, weekStartDay);
      const windowStartIso = new Date(s.windowStartAt).toISOString();
      const windowEndIso = new Date(s.windowEndAt).toISOString();

      let reflectionText: string;
      try {
        const created = await generateRollingReflection({
          windowStartIso,
          windowEndIso,
          metrics: {
            decisionCount: s.decisionCount,
            focusCopy: s.focusCopy,
            mostCommonCategory: s.mostCommonCategory,
            decisionFocus: {
              focusCategory: s.decisionFocus.focusCategory ? categoryLabel(s.decisionFocus.focusCategory) : null,
              isTie: s.decisionFocus.isTie,
            },
            confidenceByCategoryInsight: {
              kind: s.confidenceByCategoryInsight.kind,
              category: s.confidenceByCategoryInsight.category ? categoryLabel(s.confidenceByCategoryInsight.category) : null,
            },
            avgConfidence: s.avgConfidence,
            confidenceTrend: s.confidenceTrend,
            directionStatus: s.directionStatus,
            notablePatterns: s.notablePatterns,
          },
        });
        reflectionText = created.reflectionText;
      } catch {
        const installId = await getOrCreateInstallId();
        const composed = composeWeeklyReflection({
          userId: installId,
          weekStartDate: windowStartIso,
          weekEndDate: windowEndIso,
          metrics: {
            decisionCount: s.decisionCount,
            topCategory: s.mostCommonCategory ? categoryLabel(s.mostCommonCategory) : null,
            secondaryCategory: s.secondaryCategory ? categoryLabel(s.secondaryCategory) : null,
            categoryOverlaps: s.categoryOverlaps ? { a: categoryLabel(s.categoryOverlaps.a), b: categoryLabel(s.categoryOverlaps.b) } : null,
            avgConfidence: s.avgConfidence,
            confidenceTrend: s.confidenceTrend,
            mostRepeatedTag: s.mostRepeatedTag,
            daysWithDecisions: s.daysWithDecisions,
          },
        });
        reflectionText = composed.text;
      }

      const nowIso = new Date().toISOString();
      await setPreviousWeekReflectionCache({
        windowStartIso,
        windowEndIso,
        generatedAtIso: nowIso,
        reflectionText,
      });
      await setPreviousWeekGrace({ used: true, usedAtIso: nowIso });

      setPreviousWeekUsed(true);
      setPreviousWeekReflection(reflectionText);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not generate a reflection.';
      setError(message);
    } finally {
      setGeneratingPreviousWeek(false);
    }
  };

  const onGenerateLastWeekDev = async (): Promise<void> => {
    if (!__DEV__ || generating) return;

    setGenerating(true);
    setError(null);
    try {
      const weekStartDay = await getWeekStartDay();
      const nowMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const s = await getWeeklyReviewDetail(nowMs, weekStartDay);

      const installId = await getOrCreateInstallId();
      const composed = composeWeeklyReflection({
        userId: installId,
        weekStartDate: new Date(s.windowStartAt).toISOString(),
        weekEndDate: new Date(s.windowEndAt).toISOString(),
        metrics: {
          decisionCount: s.decisionCount,
          topCategory: s.mostCommonCategory ? categoryLabel(s.mostCommonCategory) : null,
          secondaryCategory: s.secondaryCategory ? categoryLabel(s.secondaryCategory) : null,
          categoryOverlaps: s.categoryOverlaps
            ? { a: categoryLabel(s.categoryOverlaps.a), b: categoryLabel(s.categoryOverlaps.b) }
            : null,
          avgConfidence: s.avgConfidence,
          confidenceTrend: s.confidenceTrend,
          mostRepeatedTag: s.mostRepeatedTag,
          daysWithDecisions: s.daysWithDecisions,
        },
      });

      setReflection(composed.text);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not generate a reflection.';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [saveVersion]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [saveVersion])
  );

  useEffect(() => {
    if (!__DEV__) return;
    if (route.params?.devAction !== 'generate_last_week') return;
    if (generating) return;
    onGenerateLastWeekDev();
    navigation.setParams({ devAction: undefined });
  }, [generating, navigation, route.params?.devAction]);

  const unlockState = useMemo(() => {
    if (!snapshot) return null;
    return getReviewUnlockState({
      nowMs: Date.now(),
      days: 7,
      weekStartDay,
      firstAppUseAtIso,
      lastReflectionAtIso,
      hasAtLeastOneDecisionInWindow: snapshot.decisionCount >= 1,
      cachedGeneratedAtIso,
    });
  }, [cachedGeneratedAtIso, firstAppUseAtIso, lastReflectionAtIso, snapshot, weekStartDay]);

  const canGenerate = useMemo(() => {
    return !generating && snapshot !== null && unlockState?.kind === 'UNLOCKED';
  }, [generating, snapshot, unlockState]);

  const daysLabel = useMemo(() => {
    const n = unlockState && 'daysRemaining' in unlockState ? unlockState.daysRemaining : null;
    if (n === null) return null;
    return n === 1 ? 'day' : 'days';
  }, [unlockState]);

  const onGenerate = async (): Promise<void> => {
    if (!snapshot || generating) return;
    if (unlockState?.kind !== 'UNLOCKED') return;

    setGenerating(true);
    setError(null);
    try {
      const created = isSubscribed
        ? await generateRollingReflection({
            windowStartIso: snapshot.windowStartIso,
            windowEndIso: snapshot.windowEndIso,
            metrics: {
              decisionCount: snapshot.decisionCount,
              focusCopy: snapshot.focusCopy,
              mostCommonCategory: snapshot.mostCommonCategory,
              decisionFocus: {
                focusCategory: snapshot.decisionFocus.focusCategory ? categoryLabel(snapshot.decisionFocus.focusCategory) : null,
                isTie: snapshot.decisionFocus.isTie,
              },
              confidenceByCategoryInsight: {
                kind: snapshot.confidenceByCategoryInsight.kind,
                category: snapshot.confidenceByCategoryInsight.category
                  ? categoryLabel(snapshot.confidenceByCategoryInsight.category)
                  : null,
              },
              avgConfidence: snapshot.avgConfidence,
              confidenceTrend: snapshot.confidenceTrend,
              directionStatus: snapshot.directionStatus,
              notablePatterns: snapshot.notablePatterns,
            },
          })
        : (() => {
            throw new Error('FREE_COMPOSER');
          })();

      const installId = await getOrCreateInstallId();
      const composed = composeWeeklyReflection({
        userId: installId,
        weekStartDate: snapshot.windowStartIso,
        weekEndDate: snapshot.windowEndIso,
        metrics: {
          decisionCount: snapshot.decisionCount,
          topCategory: snapshot.mostCommonCategory ? categoryLabel(snapshot.mostCommonCategory) : null,
          secondaryCategory: snapshot.secondaryCategory ? categoryLabel(snapshot.secondaryCategory) : null,
          categoryOverlaps: snapshot.categoryOverlaps
            ? { a: categoryLabel(snapshot.categoryOverlaps.a), b: categoryLabel(snapshot.categoryOverlaps.b) }
            : null,
          avgConfidence: snapshot.avgConfidence,
          confidenceTrend: snapshot.confidenceTrend,
          mostRepeatedTag: snapshot.mostRepeatedTag,
          daysWithDecisions: snapshot.daysWithDecisions,
        },
      });

      const nowIso = new Date().toISOString();
      await setRollingReflectionCache({
        windowStart: snapshot.windowStartIso,
        windowEnd: snapshot.windowEndIso,
        generatedAt: nowIso,
        reflectionText: isSubscribed ? created.reflectionText : composed.text,
        observedPatternText: isSubscribed ? created.observedPatternText : '',
        gentleQuestionText: null,
      });
      await setLastReflectionAt(nowIso);

      setLastReflectionAtIso(nowIso);
      setCachedGeneratedAtIso(nowIso);
      setReflection(isSubscribed ? created.reflectionText : composed.text);
    } catch (e) {
      if (!isSubscribed && e instanceof Error && e.message === 'FREE_COMPOSER') {
        try {
          const installId = await getOrCreateInstallId();
          const composed = composeWeeklyReflection({
            userId: installId,
            weekStartDate: snapshot!.windowStartIso,
            weekEndDate: snapshot!.windowEndIso,
            metrics: {
              decisionCount: snapshot!.decisionCount,
              topCategory: snapshot!.mostCommonCategory ? categoryLabel(snapshot!.mostCommonCategory) : null,
              secondaryCategory: snapshot!.secondaryCategory ? categoryLabel(snapshot!.secondaryCategory) : null,
              categoryOverlaps: snapshot!.categoryOverlaps
                ? { a: categoryLabel(snapshot!.categoryOverlaps.a), b: categoryLabel(snapshot!.categoryOverlaps.b) }
                : null,
              avgConfidence: snapshot!.avgConfidence,
              confidenceTrend: snapshot!.confidenceTrend,
              mostRepeatedTag: snapshot!.mostRepeatedTag,
              daysWithDecisions: snapshot!.daysWithDecisions,
            },
          });

          const nowIso = new Date().toISOString();
          await setRollingReflectionCache({
            windowStart: snapshot!.windowStartIso,
            windowEnd: snapshot!.windowEndIso,
            generatedAt: nowIso,
            reflectionText: composed.text,
            observedPatternText: '',
            gentleQuestionText: null,
          });
          await setLastReflectionAt(nowIso);

          setLastReflectionAtIso(nowIso);
          setCachedGeneratedAtIso(nowIso);
          setReflection(composed.text);
          return;
        } catch (inner) {
          const message = inner instanceof Error ? inner.message : 'Could not generate a reflection.';
          setError(message);
          return;
        }
      }
      const message = e instanceof Error ? e.message : 'Could not generate a reflection.';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.primaryMuted }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.textPrimary }]}>Review</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>A weekly snapshot and reflection from your journal entries.</Text>

      <View style={styles.spacer} />

      {status === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : status === 'error' ? (
        <Card>
          <Text style={[styles.cardTitle, { color: c.textPrimary }]}>Couldn’t load review</Text>
          <Text style={[styles.cardBody, { color: c.textSecondary }]}>{error ?? 'Please try again.'}</Text>
        </Card>
      ) : snapshot ? (
        <>
          <Card>
            <Text style={[styles.cardTitle, { color: c.textPrimary }]}>Weekly Snapshot</Text>
            <Text style={[styles.cardBody, { color: c.textSecondary }]}>A simple summary of how your decisions felt this week.</Text>

            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: c.textSecondary }]}>Decisions logged</Text>
              <Text style={[styles.metricValue, { color: c.textPrimary }]}>{snapshot.decisionCount}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: c.textSecondary }]}>Most common category</Text>
              <Text style={[styles.metricValue, { color: c.textPrimary }]}>
                {snapshot.mostCommonCategory ? categoryLabel(snapshot.mostCommonCategory) : '—'}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: c.textSecondary }]}>Confidence trend</Text>
              <Text style={[styles.metricValue, { color: c.textPrimary }]}>{confidenceTrendCopy(snapshot.confidenceTrend)}</Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: c.textSecondary }]}>Direction</Text>
              <Text style={[styles.metricValue, { color: c.textPrimary }]}>
                {snapshot.directionStatus === 'NO_SIGNAL'
                  ? 'Not enough data yet'
                  : directionStatusCopy(snapshot.directionStatus).title}
              </Text>
            </View>

            <View style={styles.badgeRow}>
              <DirectionStatusBadge status={snapshot.directionStatus} />
            </View>
          </Card>

          <View style={styles.spacer} />

          <Card>
            <Text style={[styles.cardTitle, { color: c.textPrimary }]}>Weekly Reflection</Text>
            <Text style={[styles.cardBody, { color: c.textSecondary }]}>A calm summary of what you recorded this week.</Text>

            {!reflection ? (
              <View style={styles.footer}>
                {unlockState?.kind === 'LOCKED_TIME' ? (
                  <Text style={[styles.cardBody, { color: c.textSecondary }]}>
                    Your next reflection will be ready in {unlockState.daysRemaining} {daysLabel}.
                  </Text>
                ) : unlockState?.kind === 'LOCKED_WEEKDAY' ? (
                  <Text style={[styles.cardBody, { color: c.textSecondary }]}>
                    Your reflection is available on the last day of your week (in {unlockState.daysRemaining} {daysLabel}).
                  </Text>
                ) : unlockState?.kind === 'LOCKED_DATA' ? (
                  <Text style={[styles.cardBody, { color: c.textSecondary }]}>Log at least one decision this week to generate a reflection.</Text>
                ) : unlockState?.kind === 'UNLOCKED' ? (
                  <Text style={[styles.cardBody, { color: c.textSecondary }]}>Take a moment to reflect on your week.</Text>
                ) : null}
                <AppButton
                  title={generating ? 'Generating…' : 'Generate Weekly Reflection'}
                  onPress={onGenerate}
                  disabled={!canGenerate}
                />
              </View>
            ) : (
              <>
                {unlockState?.kind === 'CACHED_THIS_WINDOW' ? (
                  <Text style={[styles.cardBody, { color: c.textSecondary }]}>This week’s reflection</Text>
                ) : null}
                <Text style={[styles.reflectionText, { color: c.textPrimary }]}>{reflection}</Text>
              </>
            )}
          </Card>

          <View style={styles.spacer} />

          <Card>
            <Text style={[styles.cardTitle, { color: c.textPrimary }]}>Previous Week Reflection</Text>
            <Text style={[styles.cardBody, { color: c.textSecondary }]}>A one-time look back, if you missed last week.</Text>

            {previousWeekReflection ? (
              <Text style={[styles.reflectionText, { color: c.textPrimary }]}>{previousWeekReflection}</Text>
            ) : (
              <View style={styles.footer}>
                {!isSubscribed ? (
                  <Text style={[styles.cardBody, { color: c.textSecondary }]}>Available with PONDR Plus.</Text>
                ) : previousWeekUsed ? (
                  <Text style={[styles.cardBody, { color: c.textSecondary }]}>You’ve already used your previous-week reflection.</Text>
                ) : (
                  <Text style={[styles.cardBody, { color: c.textSecondary }]}>If you’d like, you can generate last week’s reflection once.</Text>
                )}

                <AppButton
                  title={generatingPreviousWeek ? 'Generating…' : !isSubscribed ? 'Learn more' : previousWeekUsed ? 'Used' : 'Generate Previous Week'}
                  variant={!isSubscribed ? 'secondary' : undefined}
                  onPress={!isSubscribed ? () => navigation.navigate('PONDRPlus' as never) : onGeneratePreviousWeek}
                  disabled={!isSubscribed ? false : !canGeneratePreviousWeek}
                />
              </View>
            )}
          </Card>

          {error ? (
            <Text style={[styles.inlineError, { color: c.warning }]}>{error}</Text>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
  },
  spacer: {
    height: 12,
  },
  spacerSmall: {
    height: 8,
  },
  center: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  metricRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  metricValue: {
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap',
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '800',
  },
  badgeRow: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  footer: {
    marginTop: 12,
    gap: 10,
  },
  reflectionText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  inlineError: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
});

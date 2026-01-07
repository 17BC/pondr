import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { AppButton } from '../components/common/AppButton';
import { Card } from '../components/common/Card';
import { DirectionStatusBadge } from '../components/decision/DirectionStatusBadge';
import { colors } from '../theme/colors';
import { useDecisionEventsStore } from '../store/useDecisionEventsStore';
import { getWeeklyReviewDetail } from '../services/database/decisions';
import { categoryLabel } from '../utils/categoryLabel';
import { generateRollingReflection } from '../services/ai/reviewReflection';
import { getGentleQuestionHistory, setGentleQuestionHistory } from '../review/gentleQuestionHistoryStorage';
import { nextGentleQuestionHistory, selectGentleQuestion } from '../review/selectGentleQuestion';
import {
  ensureFirstAppUseAt,
  getLastReflectionAt,
  getRollingReflectionCache,
  setLastReflectionAt,
  setRollingReflectionCache,
} from '../review/reflectionRitualStorage';
import { getReviewUnlockState } from '../review/reflectionUnlock';
import { confidenceTrendCopy, getCurrentWeekRange } from '../confidence/confidence';
import { getWeekStartDay } from '../settings/weekSettings';

export function ReviewScreen(): React.JSX.Element {
  const c = colors.light;

  const saveVersion = useDecisionEventsStore((s) => s.saveVersion);

  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [snapshot, setSnapshot] = useState<
    | (Awaited<ReturnType<typeof getWeeklyReviewDetail>> & { windowStartIso: string; windowEndIso: string })
    | null
  >(null);
  const [reflection, setReflection] = useState<string | null>(null);
  const [observedPattern, setObservedPattern] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstAppUseAtIso, setFirstAppUseAtIso] = useState<string | null>(null);
  const [lastReflectionAtIso, setLastReflectionAtIso] = useState<string | null>(null);
  const [cachedGeneratedAtIso, setCachedGeneratedAtIso] = useState<string | null>(null);
  const [weekStartDay, setWeekStartDay] = useState<number>(1);

  const refresh = async (): Promise<void> => {
    setStatus('loading');
    setError(null);
    try {
      const nowMs = Date.now();
      const firstUse = await ensureFirstAppUseAt(nowMs);
      const lastAt = await getLastReflectionAt();
      const cache = await getRollingReflectionCache();

      const weekStartDay = await getWeekStartDay();
      setWeekStartDay(weekStartDay);
      const s = await getWeeklyReviewDetail(nowMs, weekStartDay);

      setFirstAppUseAtIso(firstUse);
      setLastReflectionAtIso(lastAt);
      setCachedGeneratedAtIso(cache?.generatedAt ?? null);

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
        setObservedPattern(cache.observedPatternText);
        setQuestion(cache.gentleQuestionText);
      } else {
        setReflection(null);
        setObservedPattern(null);
        setQuestion(null);
      }
      setStatus('idle');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not load your weekly review.';
      setError(message);
      setStatus('error');
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
      const history = await getGentleQuestionHistory();

      const created = await generateRollingReflection({
        windowStartIso: new Date(s.windowStartAt).toISOString(),
        windowEndIso: new Date(s.windowEndAt).toISOString(),
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

      const selected = selectGentleQuestion(
        {
          decisionCount: s.decisionCount,
          mostCommonCategory: s.mostCommonCategory,
          confidenceTrend: s.confidenceTrend,
          directionStatus: s.directionStatus,
        },
        history,
        { cooldownWeeks: 6 }
      );

      setReflection(created.reflectionText);
      setObservedPattern(created.observedPatternText);
      setQuestion(selected.renderedText);
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

  const canGenerateDevLastWeek = useMemo(() => {
    return !generating && __DEV__;
  }, [generating]);

  const onGenerate = async (): Promise<void> => {
    if (!snapshot || generating) return;
    if (unlockState?.kind !== 'UNLOCKED') return;

    setGenerating(true);
    setError(null);
    try {
      const history = await getGentleQuestionHistory();

      const created = await generateRollingReflection({
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
            category: snapshot.confidenceByCategoryInsight.category ? categoryLabel(snapshot.confidenceByCategoryInsight.category) : null,
          },
          avgConfidence: snapshot.avgConfidence,
          confidenceTrend: snapshot.confidenceTrend,
          directionStatus: snapshot.directionStatus,
          notablePatterns: snapshot.notablePatterns,
        },
      });

      const selected = selectGentleQuestion(
        {
          decisionCount: snapshot.decisionCount,
          mostCommonCategory: snapshot.mostCommonCategory,
          confidenceTrend: snapshot.confidenceTrend,
          directionStatus: snapshot.directionStatus,
        },
        history,
        { cooldownWeeks: 6 }
      );

      const nowIso = new Date().toISOString();
      await setRollingReflectionCache({
        windowStart: snapshot.windowStartIso,
        windowEnd: snapshot.windowEndIso,
        generatedAt: nowIso,
        reflectionText: created.reflectionText,
        observedPatternText: created.observedPatternText,
        gentleQuestionText: selected.renderedText,
      });
      await setLastReflectionAt(nowIso);

      await setGentleQuestionHistory(
        nextGentleQuestionHistory({
          selectedQuestionId: selected.question.id,
          previous: history,
          maxItems: 12,
        })
      );

      setLastReflectionAtIso(nowIso);
      setCachedGeneratedAtIso(nowIso);
      setReflection(created.reflectionText);
      setObservedPattern(created.observedPatternText);
      setQuestion(selected.renderedText);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not generate a reflection.';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.textPrimary }]}>Review</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>A calm weekly snapshot and reflection.</Text>

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
            <Text style={[styles.cardBody, { color: c.textSecondary }]}>Patterns from this week — no analysis, no advice.</Text>

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

            <View style={styles.badgeRow}>
              <DirectionStatusBadge status={snapshot.directionStatus} />
            </View>
          </Card>

          <View style={styles.spacer} />

          <Card>
            <Text style={[styles.cardTitle, { color: c.textPrimary }]}>Reflection</Text>
            <Text style={[styles.cardBody, { color: c.textSecondary }]}>Generated once per week. Read-only.</Text>

            {!reflection ? (
              <View style={styles.footer}>
                {unlockState?.kind === 'LOCKED_TIME' ? (
                  <Text style={[styles.cardBody, { color: c.textSecondary }]}>
                    Your next reflection will be ready in {unlockState.daysRemaining} days.
                  </Text>
                ) : unlockState?.kind === 'LOCKED_WEEKDAY' ? (
                  <Text style={[styles.cardBody, { color: c.textSecondary }]}>
                    Your reflection is available on the last day of your week (in {unlockState.daysRemaining} days).
                  </Text>
                ) : unlockState?.kind === 'LOCKED_DATA' ? (
                  <Text style={[styles.cardBody, { color: c.textSecondary }]}>Log at least one decision this week to generate a reflection.</Text>
                ) : unlockState?.kind === 'UNLOCKED' ? (
                  <Text style={[styles.cardBody, { color: c.textSecondary }]}>Take a moment to reflect on your week.</Text>
                ) : null}
                <AppButton
                  title={generating ? 'Generating…' : 'Generate Reflection'}
                  onPress={onGenerate}
                  disabled={!canGenerate}
                />
                {__DEV__ ? (
                  <View style={styles.devButtonSpacer}>
                    <AppButton
                      title={generating ? 'Generating…' : 'Generate Last Week (Dev)'}
                      onPress={onGenerateLastWeekDev}
                      disabled={!canGenerateDevLastWeek}
                      variant="ghost"
                    />
                  </View>
                ) : null}
              </View>
            ) : (
              <>
                {unlockState?.kind === 'CACHED_THIS_WINDOW' ? (
                  <Text style={[styles.cardBody, { color: c.textSecondary }]}>This week’s reflection</Text>
                ) : null}
                <Text style={[styles.reflectionText, { color: c.textPrimary }]}>{reflection}</Text>
                <View style={styles.spacerSmall} />
                <Text style={[styles.cardBody, { color: c.textSecondary }]}>Observed pattern</Text>
                <Text style={[styles.reflectionText, { color: c.textPrimary }]}>{observedPattern ?? '—'}</Text>
              </>
            )}
          </Card>

          <View style={styles.spacer} />

          <Card>
            <Text style={[styles.cardTitle, { color: c.textPrimary }]}>Gentle Question</Text>
            <Text style={[styles.cardBody, { color: c.textSecondary }]}>Optional. No answer required.</Text>
            <Text style={[styles.reflectionText, { color: c.textPrimary }]}>{question ?? '—'}</Text>
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
  devButtonSpacer: {
    marginTop: 6,
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

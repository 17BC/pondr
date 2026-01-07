import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { Card } from '../components/common/Card';
import { InsightCard } from '../components/insights/InsightCard';
import { colors } from '../theme/colors';
import { useDecisionEventsStore } from '../store/useDecisionEventsStore';
import { useInsightsStore } from '../store/useInsightsStore';
import { getWeeklyConfidenceSeries } from '../services/database/decisions';
import { getWeekStartDay } from '../settings/weekSettings';
import type { InsightCard as InsightCardModel, InsightCardType } from '../insights/insightTypes';

export function InsightsScreen(): React.JSX.Element {
  const c = colors.light;

  const saveVersion = useDecisionEventsStore((s) => s.saveVersion);
  const status = useInsightsStore((s) => s.status);
  const data = useInsightsStore((s) => s.data);
  const refresh = useInsightsStore((s) => s.refresh);

  const [series, setSeries] = useState<Array<{ dayStartAt: number; avgConfidence: number | null; count: number }>>([]);
  const [seriesStatus, setSeriesStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  // Direction is the anchor: it gives quick orientation first.
  // The rest of the cards explain what may be contributing to that direction.
  const orderedCards = useMemo(() => {
    const byType = new Map<InsightCardType, InsightCardModel>();
    for (const card of data.cards) {
      if (!byType.has(card.type)) byType.set(card.type, card);
    }

    const order: InsightCardType[] = [
      'direction_status',
      'decision_focus',
      'confidence_trend',
      'confidence_by_category',
      'decision_pace',
    ];

    return order.map((t) => byType.get(t)).filter(Boolean) as InsightCardModel[];
  }, [data.cards]);

  useEffect(() => {
    refresh();
  }, [refresh, saveVersion]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setSeriesStatus('loading');
      try {
        const weekStartDay = await getWeekStartDay();
        const s = await getWeeklyConfidenceSeries(Date.now(), weekStartDay);
        if (!alive) return;
        setSeries(s);
        setSeriesStatus('idle');
      } catch {
        if (!alive) return;
        setSeriesStatus('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [saveVersion]);

  const hasAnySeriesData = useMemo(() => series.some((p) => (p.count ?? 0) > 0), [series]);

  const weeklyAvgFromSeries = useMemo(() => {
    const total = series.reduce((acc, p) => acc + (p.avgConfidence === null ? 0 : p.avgConfidence * p.count), 0);
    const count = series.reduce((acc, p) => acc + (p.count ?? 0), 0);
    if (count <= 0) return null;
    return total / count;
  }, [series]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.textPrimary }]}>Insights</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>Patterns from your past decisions — kept simple.</Text>

      <View style={styles.spacer} />

      {status === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : status === 'error' ? (
        <Card>
          <Text style={[styles.cardTitle, { color: c.textPrimary }]}>Couldn’t load insights</Text>
          <Text style={[styles.cardBody, { color: c.textSecondary }]}>Try again in a moment.</Text>
        </Card>
      ) : data.cards.length === 0 ? (
        <Card>
          <Text style={[styles.cardTitle, { color: c.textPrimary }]}>No data yet</Text>
          <Text style={[styles.cardBody, { color: c.textSecondary }]}>Log a few decisions to see patterns emerge.</Text>
        </Card>
      ) : (
        <>
          {orderedCards.map((card) => (
            <View key={card.id} style={styles.cardSpacer}>
              <InsightCard card={card} />
            </View>
          ))}

          <View style={styles.cardSpacer}>
            <Card padding={12} style={[styles.chartCard, { borderColor: c.border, backgroundColor: c.surface }]}> 
              <Text style={[styles.cardTitle, { color: c.textPrimary }]}>Confidence (This Week)</Text>
              <Text style={[styles.cardBody, { color: c.textSecondary }]}>
                A simple view of average confidence by day (1–5). No scoring.
              </Text>

              {seriesStatus === 'loading' ? (
                <View style={styles.centerChart}>
                  <ActivityIndicator />
                </View>
              ) : seriesStatus === 'error' ? (
                <Text style={[styles.cardBody, { color: c.textSecondary }]}>Couldn’t load chart data.</Text>
              ) : !hasAnySeriesData ? (
                <Text style={[styles.cardBody, { color: c.textSecondary }]}>Log your first decision to see confidence over time.</Text>
              ) : (
                <>
                  <DotChart series={series} weeklyAvg={weeklyAvgFromSeries} />
                  <Text style={[styles.weeklyAvgText, { color: c.textSecondary }]}>
                    Weekly average: {weeklyAvgFromSeries === null ? '—' : weeklyAvgFromSeries.toFixed(1)}
                  </Text>
                </>
              )}
            </Card>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function DotChart(props: {
  series: Array<{ dayStartAt: number; avgConfidence: number | null; count: number }>;
  weeklyAvg: number | null;
}): React.JSX.Element {
  const c = colors.light;
  const height = 90;
  const widthPer = 42;
  const yAxisWidth = 18;

  const points = props.series.map((p) => {
    const y = p.avgConfidence === null ? null : ((p.avgConfidence - 1) / 4) * height;
    const d = new Date(p.dayStartAt);
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    return { ...p, y, label };
  });

  const yTicks = [5, 4, 3, 2, 1];

  return (
    <View style={styles.chartWrap}>
      <View style={styles.chartRow}>
        <View style={[styles.yAxis, { height, width: yAxisWidth }]}>
          {yTicks.map((tick) => (
            <Text
              key={tick}
              style={[
                styles.yAxisLabel,
                {
                  color: c.textMuted,
                  bottom: ((tick - 1) / 4) * height,
                },
              ]}
            >
              {tick}
            </Text>
          ))}
        </View>

        <View style={[styles.chartArea, { height }]}>
          {props.weeklyAvg === null ? null : (
            <View
              style={[
                styles.chartAvgLine,
                {
                  borderColor: c.primaryMuted,
                  bottom: Math.max(0, Math.min(height, ((props.weeklyAvg - 1) / 4) * height)),
                },
              ]}
            />
          )}

          {points.map((p) => (
            <View key={p.dayStartAt} style={[styles.chartCol, { width: widthPer }]}> 
              <View style={styles.chartColInner}>
                {p.y === null ? (
                  <View style={[styles.chartEmptyDot, { borderColor: c.border }]} />
                ) : (
                  <View
                    style={[
                      styles.chartDot,
                      {
                        backgroundColor: c.primary,
                        bottom: Math.max(0, Math.min(height, p.y)),
                      },
                    ]}
                  />
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.xLabelRow, { paddingLeft: yAxisWidth }]}> 
        {points.map((p) => (
          <View key={p.dayStartAt} style={[styles.xLabelCol, { width: widthPer }]}> 
            <Text style={[styles.chartLabel, { color: c.textSecondary }]}>{p.label}</Text>
          </View>
        ))}
      </View>
    </View>
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
  cardSpacer: {
    marginBottom: 12,
  },
  centerChart: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartWrap: {
    marginTop: 16,
  },
  chartCard: {
    // Slightly lighter visual weight than other cards (still consistent with Card styling).
    borderWidth: 1,
  },
  chartOptionalLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  xLabelRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 6,
  },
  xLabelCol: {
    alignItems: 'center',
  },
  yAxis: {
    paddingRight: 6,
    position: 'relative',
  },
  yAxisLabel: {
    position: 'absolute',
    right: 0,
    fontSize: 11,
    fontWeight: '600',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
  },
  chartAvgLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    opacity: 0.45,
    borderStyle: 'dashed',
  },
  chartCol: {
    alignItems: 'center',
  },
  chartColInner: {
    width: 22,
    height: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  chartDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    position: 'absolute',
    left: 6,
  },
  chartEmptyDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 0,
  },
  chartLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  weeklyAvgText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});

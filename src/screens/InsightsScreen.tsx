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

export function InsightsScreen(): React.JSX.Element {
  const c = colors.light;

  const saveVersion = useDecisionEventsStore((s) => s.saveVersion);
  const status = useInsightsStore((s) => s.status);
  const data = useInsightsStore((s) => s.data);
  const refresh = useInsightsStore((s) => s.refresh);

  const [series, setSeries] = useState<Array<{ dayStartAt: number; avgConfidence: number | null; count: number }>>([]);
  const [seriesStatus, setSeriesStatus] = useState<'idle' | 'loading' | 'error'>('idle');

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
          {data.cards.map((card) => (
            <View key={card.id} style={styles.cardSpacer}>
              <InsightCard card={card} />
            </View>
          ))}

          <View style={styles.cardSpacer}>
            <Card>
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
                <Text style={[styles.cardBody, { color: c.textSecondary }]}>Log your first decision to see trends.</Text>
              ) : (
                <DotChart series={series} />
              )}
            </Card>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function DotChart(props: { series: Array<{ dayStartAt: number; avgConfidence: number | null; count: number }> }): React.JSX.Element {
  const c = colors.light;
  const height = 90;
  const widthPer = 42;

  const points = props.series.map((p) => {
    const y = p.avgConfidence === null ? null : ((p.avgConfidence - 1) / 4) * height;
    const d = new Date(p.dayStartAt);
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    return { ...p, y, label };
  });

  return (
    <View style={styles.chartWrap}>
      <View style={[styles.chartArea, { height }]}>
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
            <Text style={[styles.chartLabel, { color: c.textSecondary }]}>{p.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.yLegendRow}>
        <Text style={[styles.yLegend, { color: c.textMuted }]}>1</Text>
        <Text style={[styles.yLegend, { color: c.textMuted }]}>2</Text>
        <Text style={[styles.yLegend, { color: c.textMuted }]}>3</Text>
        <Text style={[styles.yLegend, { color: c.textMuted }]}>4</Text>
        <Text style={[styles.yLegend, { color: c.textMuted }]}>5</Text>
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
    marginTop: 12,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    marginTop: 8,
    fontSize: 11,
    fontWeight: '600',
  },
  yLegendRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yLegend: {
    fontSize: 11,
    fontWeight: '600',
  },
});

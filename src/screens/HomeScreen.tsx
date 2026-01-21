import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { AppButton } from '../components/common/AppButton';
import { Card } from '../components/common/Card';
import { DirectionStatusBadge } from '../components/decision/DirectionStatusBadge';
import { colors } from '../theme/colors';
import { useDecisionEventsStore } from '../store/useDecisionEventsStore';
import { useHomeMetricsStore } from '../store/useHomeMetricsStore';
import { avgConfidenceLabel, confidenceTrendCopy, directionStatusCopy } from '../confidence/confidence';

export function HomeScreen(): React.JSX.Element {
  const c = colors.light;
  const navigation = useNavigation();

  const saveVersion = useDecisionEventsStore((s) => s.saveVersion);
  const savedBannerVisible = useDecisionEventsStore((s) => s.savedBannerVisible);
  const dismissSavedBanner = useDecisionEventsStore((s) => s.dismissSavedBanner);

  const refresh = useHomeMetricsStore((s) => s.refresh);
  const metrics = useHomeMetricsStore((s) => s.metrics);

  useEffect(() => {
    // State refresh: re-read Home metrics whenever a decision is saved.
    refresh();
  }, [refresh, saveVersion]);

  return (
    <View style={[styles.container, { backgroundColor: c.primaryMuted }]}> 
      <Text style={[styles.title, { color: c.textPrimary }]}>
        P{'\u200A'}<Image source={require('../../assets/pondr_icon_3.png')} style={styles.titleIcon} />{'\u200A'}NDR
      </Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>Reflect on decisions that matter.</Text>

      <View style={styles.spacer} />

      {savedBannerVisible ? (
        <Card padding={12}>
          <View style={styles.savedRow}>
            <Text style={[styles.savedText, { color: c.textPrimary }]}>Saved</Text>
            <AppButton title="Dismiss" variant="ghost" onPress={dismissSavedBanner} />
          </View>
        </Card>
      ) : null}

      {savedBannerVisible ? <View style={styles.spacer} /> : null}

      <Card>
        <Text style={[styles.cardTitle, { color: c.textPrimary }]}>Direction</Text>
        <Text style={[styles.cardSubtitle, { color: c.textSecondary }]}>
          A calm snapshot of where your recent decisions are pointing.
        </Text>
        {metrics.direction === 'NO_SIGNAL' ? (
          <>
            <Text style={[styles.cardSubtitle, { color: c.textSecondary }]}>
              {directionStatusCopy(metrics.direction).title}
            </Text>
            <Text style={[styles.cardSubtitle, { color: c.textSecondary }]}>
              {directionStatusCopy(metrics.direction).subtext}
            </Text>
          </>
        ) : (
          <Text style={[styles.cardSubtitle, { color: c.textSecondary }]}>
            {directionStatusCopy(metrics.direction).subtext}
          </Text>
        )}
        <View style={styles.metricsRow}>
          <Text style={[styles.metricText, { color: c.textSecondary }]}>
            Decisions this week: {metrics.weekDecisionCount}
          </Text>
          {(() => {
            const label = avgConfidenceLabel({
              count: metrics.weekDecisionCount,
              avg: metrics.weekDecisionCount > 0 ? metrics.avgConfidence : null,
            });
            return (
              <Text style={[styles.metricText, { color: c.textSecondary }]}>
                {label.label}: {label.value}
              </Text>
            );
          })()}
        </View>
        {metrics.direction === 'NO_SIGNAL' ? null : (
          <Text style={[styles.trendText, { color: c.textSecondary }]}>
            {confidenceTrendCopy(metrics.confidenceTrend)}
          </Text>
        )}
        <View style={styles.badgeRow}>
          <DirectionStatusBadge status={metrics.direction} />
        </View>
      </Card>

      <View style={styles.spacer} />

      <AppButton
        title="Quick Log"
        onPress={() => navigation.navigate('QuickLog' as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  titleIcon: {
    width: 26,
    height: 26,
    transform: [{ translateY: 2 }],
    resizeMode: 'contain',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  spacer: {
    height: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  badgeRow: {
    marginTop: 12,
  },
  metricsRow: {
    marginTop: 10,
    gap: 6,
  },
  metricText: {
    fontSize: 13,
    fontWeight: '600',
  },
  trendText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton } from '../components/common/AppButton';
import { Card } from '../components/common/Card';
import { colors } from '../theme/colors';
import { scheduleDevTestNotification } from '../notifications/notificationScheduler';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useInsightsStore } from '../store/useInsightsStore';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import type { TabParamList } from '../navigation/types';
import type { MainStackParamList } from '../navigation/types';
import type { WeekStartDay } from '../settings/weekSettings';
import { getWeekStartDay, setWeekStartDay } from '../settings/weekSettings';

export function SettingsScreen(): React.JSX.Element {
  const c = colors.light;
  const navigation = useNavigation<
    CompositeNavigationProp<BottomTabNavigationProp<TabParamList>, NativeStackNavigationProp<MainStackParamList>>
  >();
  const resetOnboarding = useOnboardingStore((s) => s.reset);
  const setInsightsNowMsOverride = useInsightsStore((s) => s.setNowMsOverride);
  const isSubscribed = useSubscriptionStore((s) => s.isSubscribed);

  const [weekStartDay, setWeekStartDayState] = useState<WeekStartDay>(1);

  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = await getWeekStartDay();
      if (!alive) return;
      setWeekStartDayState(stored);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const weekOptions = useMemo(
    () =>
      [
        { day: 0 as WeekStartDay, label: 'Sunday' },
        { day: 1 as WeekStartDay, label: 'Monday' },
        { day: 2 as WeekStartDay, label: 'Tuesday' },
        { day: 3 as WeekStartDay, label: 'Wednesday' },
        { day: 4 as WeekStartDay, label: 'Thursday' },
        { day: 5 as WeekStartDay, label: 'Friday' },
        { day: 6 as WeekStartDay, label: 'Saturday' },
      ],
    []
  );

  const onSelectWeekStart = async (day: WeekStartDay): Promise<void> => {
    setWeekStartDayState(day);
    await setWeekStartDay(day);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.primaryMuted }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.textPrimary }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        PONDR is a lightweight decision journaling app. Log decisions as they happen and reflect on patterns in focus and confidence over time—without advice, goals, or judgment.
      </Text>

      <View style={styles.sectionSpacer} />

      <Text style={[styles.sectionTitle, { color: c.textMuted }]}>PONDR Plus</Text>
      <Card>
        <Text style={[styles.plusCardTitle, { color: c.textPrimary }]}>
          P{'\u200A'}<Image source={require('../../assets/pondr_icon_3.png')} style={styles.plusTitleIcon} />{'\u200A'}NDR Plus
        </Text>
        <Text style={[styles.cardText, { color: c.textSecondary }]}>Optional flexibility for reflecting on past weeks and monthly patterns.</Text>
        <View style={styles.buttonRow}>
          <AppButton
            title={isSubscribed ? 'Manage Subscription' : 'Learn more'}
            variant="secondary"
            onPress={() => navigation.navigate('PONDRPlus', { entry: 'settings' })}
          />
        </View>
      </Card>

      <View style={styles.sectionSpacer} />

      <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Reflections</Text>
      <Card>
        <Text style={[styles.cardText, { color: c.textSecondary }]}>Monthly Reflection</Text>
        <Text style={[styles.cardText, { color: c.textSecondary, marginTop: 8 }]}>
          A gentle look at patterns across the month.
        </Text>
        <View style={styles.buttonRow}>
          <AppButton
            title={isSubscribed ? 'Open' : 'Available on PONDR Plus'}
            variant="secondary"
            onPress={() => (isSubscribed ? navigation.navigate('MonthlyReflection') : navigation.navigate('PONDRPlus'))}
          />
        </View>
      </Card>

      <View style={styles.sectionSpacer} />

      <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Weekly Summary</Text>
      <Card>
        <Text style={[styles.cardText, { color: c.textSecondary }]}>Week starts on</Text>
        <View style={styles.pillRow}>
          {weekOptions.map((opt) => {
            const selected = opt.day === weekStartDay;
            return (
              <Pressable
                key={opt.day}
                onPress={() => onSelectWeekStart(opt.day)}
                style={[
                  styles.pill,
                  { borderColor: c.border },
                  selected ? { backgroundColor: c.primaryMuted, borderColor: c.primary } : undefined,
                ]}
              >
                <Text style={[styles.pillText, { color: selected ? c.textPrimary : c.textSecondary }]}> {opt.label} </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.cardText, { color: c.textSecondary, marginTop: 10 }]}>This affects weekly counts in Home and Insights.</Text>
      </Card>

      <View style={styles.sectionSpacer} />

      <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Developer</Text>
      <Card>
        <Text style={[styles.cardText, { color: c.textSecondary }]}>
          Use this to re-test first-launch onboarding without reinstalling.
        </Text>
        <View style={styles.buttonRow}>
          <AppButton title="Reset Onboarding" variant="secondary" onPress={resetOnboarding} />
        </View>
        {__DEV__ ? (
          <>
            <View style={styles.buttonRow}>
              <AppButton
                title="Test Notification (60s)"
                variant="secondary"
                onPress={() => scheduleDevTestNotification(60)}
              />
            </View>
            <View style={styles.buttonRow}>
              <AppButton
                title="Generate Last Week (Dev)"
                variant="secondary"
                onPress={() => {
                  setInsightsNowMsOverride(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  navigation.navigate('Review', { devAction: 'generate_last_week' });
                }}
              />
            </View>
            <View style={styles.buttonRow}>
              <AppButton
                title="Use Current Week (Dev)"
                variant="secondary"
                onPress={() => setInsightsNowMsOverride(null)}
              />
            </View>
          </>
        ) : null}
      </Card>
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
  sectionSpacer: {
    height: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  plusCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  plusTitleIcon: {
    width: 10,
    height: 10,
    transform: [{ translateY: 1 }],
    resizeMode: 'contain',
  },
  cardText: {
    fontSize: 13,
    lineHeight: 18,
  },
  buttonRow: {
    marginTop: 12,
  },
  pillRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/common/AppButton';
import { Card } from '../components/common/Card';
import { colors } from '../theme/colors';
import { useOnboardingStore } from '../store/useOnboardingStore';
import type { WeekStartDay } from '../settings/weekSettings';
import { getWeekStartDay, setWeekStartDay } from '../settings/weekSettings';

export function SettingsScreen(): React.JSX.Element {
  const c = colors.light;
  const resetOnboarding = useOnboardingStore((s) => s.reset);

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
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.textPrimary }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>Export, privacy, about.</Text>

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
        <Text style={[styles.cardText, { color: c.textSecondary, marginTop: 10 }]}>This affects “This week” counts in Home and Insights.</Text>
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
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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

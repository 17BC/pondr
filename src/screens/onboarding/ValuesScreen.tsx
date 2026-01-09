import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '../../components/common/AppButton';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import type { OnboardingStackParamList } from '../../navigation/types';
import { setValues } from '../../storage/cnsdrStorage';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Values'>;

const DEFAULT_VALUES = [
  'Growth',
  'Peace',
  'Freedom',
  'Stability',
  'Learning',
  'Relationships',
  'Health',
  'Creativity',
] as const;

export function ValuesScreen({ navigation }: Props): React.JSX.Element {
  const c = colors.light;
  const [selected, setSelected] = useState<string[]>([]);

  const chips = useMemo(() => DEFAULT_VALUES.map((v) => v as string), []);

  const toggle = (value: string) => {
    setSelected((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  };

  const continueNext = async () => {
    await setValues(selected);
    navigation.navigate('Privacy');
  };

  return (
    <View style={[styles.container, { backgroundColor: c.primaryMuted }]}>
      <Text style={[styles.title, { color: c.textPrimary }]}>What matters to you?</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>Optional — pick a few. You can change this later.</Text>

      <View style={styles.spacer} />

      <Card>
        <View style={styles.chipWrap}>
          {chips.map((label) => {
            const active = selected.includes(label);
            return (
              <Pressable
                key={label}
                onPress={() => toggle(label)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? c.primaryMuted : c.surface,
                    borderColor: active ? c.primary : c.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, { color: active ? c.textPrimary : c.textSecondary }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <View style={styles.footerItem}>
            <AppButton title="Skip for now" variant="ghost" onPress={() => navigation.navigate('Privacy')} />
          </View>
          <View style={styles.footerItem}>
            <AppButton title="Continue" onPress={continueNext} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginTop: 28,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  spacer: {
    height: 16,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  footerItem: {
    flex: 1,
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '../../components/common/AppButton';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import type { OnboardingStackParamList } from '../../navigation/types';
import { useOnboardingStore } from '../../store/useOnboardingStore';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Privacy'>;

export function PrivacyScreen(_props: Props): React.JSX.Element {
  const c = colors.light;
  const complete = useOnboardingStore((s) => s.complete);

  return (
    <View style={[styles.container, { backgroundColor: c.primaryMuted }]}>
      <Text style={[styles.title, { color: c.textPrimary }]}>Private by default</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>PONDR is designed for reflection — not surveillance.</Text>

      <View style={styles.spacer} />

      <Card>
        <View style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: c.primary }]} />
          <Text style={[styles.bulletText, { color: c.textPrimary }]}>Your entries stay on your device</Text>
        </View>
        <View style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: c.primary }]} />
          <Text style={[styles.bulletText, { color: c.textPrimary }]}>No bank accounts or money handling</Text>
        </View>
        <View style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: c.primary }]} />
          <Text style={[styles.bulletText, { color: c.textPrimary }]}>Export anytime</Text>
        </View>
      </Card>

      <View style={styles.footer}>
        <AppButton title="Start using PONDR" onPress={complete} />
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
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
  },
});

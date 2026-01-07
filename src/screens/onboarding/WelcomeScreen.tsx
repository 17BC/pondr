import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '../../components/common/AppButton';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import type { OnboardingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props): React.JSX.Element {
  const c = colors.light;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.textPrimary }]}>CNSDR</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>Reflect on your decisions.</Text>
      </View>

      <Card>
        <Text style={[styles.copy, { color: c.textPrimary }]}>A calm place to slow down, reflect, and choose with clarity.</Text>
        <Text style={[styles.copy, { color: c.textPrimary }]}>No budgets. No bank connections. Just direction.</Text>
      </Card>

      <View style={styles.footer}>
        <AppButton title="Continue" onPress={() => navigation.navigate('Values')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 28,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
  },
  copy: {
    fontSize: 15,
    lineHeight: 21,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
  },
});

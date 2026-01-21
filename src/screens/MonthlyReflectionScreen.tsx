import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '../components/common/AppButton';
import { Card } from '../components/common/Card';
import type { MainStackParamList } from '../navigation/types';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<MainStackParamList, 'MonthlyReflection'>;

export function MonthlyReflectionScreen(props: Props): React.JSX.Element {
  const c = colors.light;

  const isSubscribed = useSubscriptionStore((s) => s.isSubscribed);
  const refresh = useSubscriptionStore((s) => s.refresh);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.primaryMuted }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: c.textPrimary }]}>Monthly Reflection</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>A gentle look at patterns across the month.</Text>

      <View style={styles.spacer} />

      {!isSubscribed ? (
        <Card>
          <Text style={[styles.cardTitle, { color: c.textPrimary }]}>Available with PONDR Plus</Text>
          <Text style={[styles.cardBody, { color: c.textSecondary }]}>Monthly reflections are part of PONDR Plus.</Text>
          <View style={styles.footer}>
            <AppButton title="Learn more" variant="secondary" onPress={() => props.navigation.navigate('PONDRPlus')} />
          </View>
        </Card>
      ) : (
        <Card>
          <Text style={[styles.cardTitle, { color: c.textPrimary }]}>Coming soon</Text>
          <Text style={[styles.cardBody, { color: c.textSecondary }]}>Monthly reflections will appear here as they’re added.</Text>
        </Card>
      )}
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    marginTop: 12,
  },
});

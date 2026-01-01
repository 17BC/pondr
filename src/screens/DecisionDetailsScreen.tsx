import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainStackParamList } from '../navigation/types';
import { AppButton } from '../components/common/AppButton';
import { Card } from '../components/common/Card';
import { colors } from '../theme/colors';
import { getDecisionById } from '../services/database/decisions';
import { categoryLabel } from '../utils/categoryLabel';

type Props = NativeStackScreenProps<MainStackParamList, 'DecisionDetails'>;

export function DecisionDetailsScreen({ route, navigation }: Props): React.JSX.Element {
  const c = colors.light;
  const decisionId = route.params.decisionId;

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<number>(0);
  const [details, setDetails] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setStatus('loading');
      setError(null);
      try {
        const decision = await getDecisionById(decisionId);
        if (!decision) {
          if (!cancelled) setStatus('error');
          return;
        }
        if (cancelled) return;
        setTitle(decision.title);
        setCategory(categoryLabel(decision.category));
        setCreatedAt(decision.createdAt);
        setDetails(decision.whyText ?? '');
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : 'Could not load this decision.';
        setError(message);
        setStatus('error');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [decisionId]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
    >
      {status === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : status === 'error' ? (
        <Card>
          <Text style={[styles.title, { color: c.textPrimary }]}>Couldn’t open this entry</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>{error ?? 'Please try again.'}</Text>
        </Card>
      ) : (
        <>
          <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
          <Text style={[styles.meta, { color: c.textSecondary }]}>
            {category} · {new Date(createdAt).toLocaleDateString()}
          </Text>

          <View style={styles.spacer} />

          <Card>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Description</Text>
            <Text style={[styles.body, { color: c.textSecondary }]}>{details.trim() ? details : '—'}</Text>
          </Card>

          <View style={styles.footer}>
            <AppButton title="Edit" onPress={() => navigation.navigate('DecisionEdit', { decisionId })} />
          </View>
        </>
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
  center: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  spacer: {
    height: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  footer: {
    marginTop: 16,
  },
});

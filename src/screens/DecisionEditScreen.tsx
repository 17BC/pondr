import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainStackParamList } from '../navigation/types';
import { AppButton } from '../components/common/AppButton';
import { Card } from '../components/common/Card';
import { colors } from '../theme/colors';
import { getDecisionById, updateDecision } from '../services/database/decisions';
import { useDecisionEventsStore } from '../store/useDecisionEventsStore';

type Props = NativeStackScreenProps<MainStackParamList, 'DecisionEdit'>;

export function DecisionEditScreen({ route, navigation }: Props): React.JSX.Element {
  const c = colors.light;
  const markSaved = useDecisionEventsStore((s) => s.markSaved);

  const decisionId = route.params.decisionId;

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [title, setTitle] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => title.trim().length > 0 && !saving, [saving, title]);

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

  const save = async (): Promise<void> => {
    if (saving) return;

    if (!title.trim()) {
      setError('Please add a short title.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateDecision({
        id: decisionId,
        title,
        whyText: details.trim().length > 0 ? details.trim() : null,
      });

      // Trigger refresh for Home + History.
      markSaved();
      navigation.goBack();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save changes.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
          <Text style={[styles.screenTitle, { color: c.textPrimary }]}>Edit</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>Update the title and add more context (optional).</Text>

          <View style={styles.spacer} />

          <Text style={[styles.label, { color: c.textPrimary }]}>Title</Text>
          <TextInput
            style={[styles.titleInput, { borderColor: c.border, backgroundColor: c.surface, color: c.textPrimary }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Short and clear"
            placeholderTextColor={c.textMuted}
            editable={!saving}
            maxLength={80}
          />

          <Text style={[styles.label, { color: c.textPrimary }]}>Description</Text>
          <TextInput
            style={[styles.detailsInput, { borderColor: c.border, backgroundColor: c.surface, color: c.textPrimary }]}
            value={details}
            onChangeText={setDetails}
            placeholder="What were you weighing? What mattered most?"
            placeholderTextColor={c.textMuted}
            editable={!saving}
            multiline
            textAlignVertical="top"
            maxLength={800}
          />

          {error ? <Text style={[styles.error, { color: c.warning }]}>{error}</Text> : null}

          <View style={styles.footer}>
            <AppButton title={saving ? 'Saving…' : 'Save'} onPress={save} disabled={!canSave} />
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  spacer: {
    height: 16,
  },
  label: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  titleInput: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 20,
  },
  detailsInput: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 160,
    lineHeight: 20,
  },
  error: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
  },
});

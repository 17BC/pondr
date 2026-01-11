import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Vibration } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { AppButton } from '../components/common/AppButton';
import { colors } from '../theme/colors';
import { createQuickDecision } from '../services/database/decisions';
import { useDecisionEventsStore } from '../store/useDecisionEventsStore';
import type { ConfidenceScore, DecisionCategory } from '../models/decision';
import { categoryLabel } from '../utils/categoryLabel';

const QUICK_CATEGORIES: DecisionCategory[] = [
  'career',
  'health',
  'relationships',
  'learning',
  'lifestyle',
  'money-choice',
  'other',
];

export function QuickLogScreen(): React.JSX.Element {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState<DecisionCategory>('other');
  const [secondaryCategories, setSecondaryCategories] = useState<DecisionCategory[]>([]);
  const [showSecondary, setShowSecondary] = useState(false);
  const [confidence, setConfidence] = useState<ConfidenceScore | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const c = colors.light;
  const markSaved = useDecisionEventsStore((s) => s.markSaved);

  const toggleSecondaryCategory = (cat: DecisionCategory): void => {
    if (cat === category) return;
    setSecondaryCategories((prev) => {
      if (prev.includes(cat)) return prev.filter((x) => x !== cat);
      if (prev.length >= 2) return prev;
      return [...prev, cat];
    });
  };

  const canSave = title.trim().length > 0 && confidence !== null && !saving;

  const saveDecision = async (): Promise<void> => {
    const trimmed = title.trim();
    if (saving) return;

    if (!trimmed) {
      setError('Please add a short title.');
      return;
    }

    if (confidence === null) {
      setError('Please select a confidence level.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Persistence: await SQLite insert.
      await createQuickDecision({
        title: trimmed,
        category,
        secondaryCategories: secondaryCategories.filter((x) => x !== category).slice(0, 2),
        whyText: details.trim().length > 0 ? details.trim() : null,
        confidence,
      });

      // Feedback: subtle haptic + non-blocking "Saved" banner on Home.
      Vibration.vibrate(10);
      markSaved();

      // Navigation: reset back to Home so the user lands predictably after saving.
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Tabs',
            state: {
              index: 0,
              routes: [{ name: 'Home' }],
            },
          },
        ],
      });

      setTitle('');
      setDetails('');
      setCategory('other');
      setSecondaryCategories([]);
      setShowSecondary(false);
      setConfidence(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save this decision.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.primaryMuted }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.textPrimary }]}>Quick Log</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>Capture the decision in a sentence.</Text>
      </View>

      <Text style={[styles.label, { color: c.textPrimary }]}>Confidence</Text>
      <Text style={[styles.help, { color: c.textSecondary }]}>
        1 = Very unsure · 2 = Somewhat unsure · 3 = Mixed / neutral · 4 = Confident · 5 = Very confident
      </Text>
      <View style={styles.dotRow}>
        {([1, 2, 3, 4, 5] as ConfidenceScore[]).map((n) => {
          const active = confidence === n;
          return (
            <Pressable
              key={n}
              onPress={() => setConfidence(n)}
              style={[
                styles.dot,
                {
                  backgroundColor: active ? c.primary : c.surface,
                  borderColor: active ? c.primary : c.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.dotText, { color: active ? '#FFFFFF' : c.textSecondary }]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: c.textPrimary }]}>Decision</Text>
      <TextInput
        style={[styles.input, { borderColor: c.border, backgroundColor: c.surface, color: c.textPrimary }]}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Take the new project"
        placeholderTextColor={c.textMuted}
        editable={!saving}
      />

      <Text style={[styles.label, { color: c.textPrimary }]}>Category</Text>
      <View style={styles.chipWrap}>
        {QUICK_CATEGORIES.map((cat) => {
          const active = cat === category;
          return (
            <Pressable
              key={cat}
              onPress={() => {
                setCategory(cat);
                setSecondaryCategories((prev) => prev.filter((x) => x !== cat));
              }}
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
              <Text style={[styles.chipText, { color: active ? c.textPrimary : c.textSecondary }]}>
                {categoryLabel(cat)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.secondaryHeaderRow}>
        <Pressable
          onPress={() => setShowSecondary((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: showSecondary }}
          style={styles.secondaryHeaderPressable}
        >
          <Text style={[styles.secondaryHeaderText, { color: c.textSecondary }]}>Also relates to</Text>
          <Text style={[styles.secondaryHeaderText, { color: c.primary }]}> {showSecondary ? 'Hide' : 'Add'}</Text>
        </Pressable>

        {secondaryCategories.length > 0 ? (
          <Text style={[styles.secondaryCount, { color: c.textSecondary }]}>
            {secondaryCategories.length}/2
          </Text>
        ) : null}
      </View>

      {showSecondary ? (
        <>
          <View style={styles.chipWrap}>
            {QUICK_CATEGORIES.filter((cat) => cat !== category).map((cat) => {
              const active = secondaryCategories.includes(cat);
              const atLimit = secondaryCategories.length >= 2;
              const disabled = !active && atLimit;
              return (
                <Pressable
                  key={`secondary-${cat}`}
                  onPress={() => toggleSecondaryCategory(cat)}
                  disabled={disabled}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? c.primaryMuted : c.surface,
                      borderColor: active ? c.primary : c.border,
                      opacity: disabled ? 0.5 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled }}
                >
                  <Text style={[styles.chipText, { color: active ? c.textPrimary : c.textSecondary }]}>
                    {categoryLabel(cat)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.secondaryHint, { color: c.textMuted }]}>Select up to 2.</Text>
        </>
      ) : null}

      <Text style={[styles.label, { color: c.textPrimary }]}>Details (optional)</Text>
      <TextInput
        style={[styles.detailsInput, { borderColor: c.border, backgroundColor: c.surface, color: c.textPrimary }]}
        value={details}
        onChangeText={setDetails}
        placeholder="A little context: why this matters, what you’re weighing…"
        placeholderTextColor={c.textMuted}
        editable={!saving}
        multiline
        textAlignVertical="top"
        maxLength={400}
      />

      {error ? <Text style={[styles.error, { color: c.warning }]}>{error}</Text> : null}

      <View style={styles.buttonRow}>
        <AppButton title={saving ? 'Saving…' : 'Save'} onPress={saveDecision} disabled={!canSave} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
  },
  label: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  detailsInput: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 110,
    lineHeight: 20,
  },
  chipWrap: {
    marginTop: 10,
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
  secondaryHeaderRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secondaryHeaderPressable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryHint: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
  },
  help: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
  },
  dotRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    fontSize: 13,
    fontWeight: '800',
  },
  error: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  buttonRow: {
    marginTop: 16,
  },
});

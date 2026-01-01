import React, { useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { AppButton } from '../components/common/AppButton';
import { Card } from '../components/common/Card';
import { colors } from '../theme/colors';
import { useDecisionEventsStore } from '../store/useDecisionEventsStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { categoryLabel } from '../utils/categoryLabel';

export function HistoryScreen(): React.JSX.Element {
  const c = colors.light;
  const navigation = useNavigation<any>();

  const saveVersion = useDecisionEventsStore((s) => s.saveVersion);
  const status = useHistoryStore((s) => s.status);
  const items = useHistoryStore((s) => s.items);
  const query = useHistoryStore((s) => s.query);
  const setQuery = useHistoryStore((s) => s.setQuery);
  const refresh = useHistoryStore((s) => s.refresh);

  useEffect(() => {
    refresh();
  }, [refresh, saveVersion]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.textPrimary }]}>History</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>Search and filter your decisions.</Text>

      <View style={styles.spacer} />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search titles"
        placeholderTextColor={c.textMuted}
        style={[styles.search, { backgroundColor: c.surface, borderColor: c.border, color: c.textPrimary }]}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={() => refresh()}
      />

      <View style={styles.spacer} />

      {status === 'loading' ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : status === 'error' ? (
        <Card>
          <Text style={[styles.emptyTitle, { color: c.textPrimary }]}>Couldn’t load history</Text>
          <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>Try again.</Text>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <Text style={[styles.emptyTitle, { color: c.textPrimary }]}>No decisions yet</Text>
          <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>Your quick logs will show up here.</Text>
        </Card>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.itemPressable}>
              <Card>
                <View style={styles.itemRow}>
                  <Pressable
                    style={styles.itemTextCol}
                    onPress={() => navigation.navigate('DecisionDetails', { decisionId: item.id })}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.itemTitle, { color: c.textPrimary }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={[styles.itemMeta, { color: c.textSecondary }]}>
                      {categoryLabel(item.category)} · {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </Pressable>

                  <View style={styles.itemActions}>
                    <AppButton
                      title="Edit"
                      variant="ghost"
                      onPress={() => navigation.navigate('DecisionEdit', { decisionId: item.id })}
                    />
                  </View>
                </View>
              </Card>
            </View>
          )}
        />
      )}
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
  spacer: {
    height: 12,
  },
  search: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 20,
    gap: 12,
  },
  itemPressable: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemTextCol: {
    flex: 1,
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  itemMeta: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
});

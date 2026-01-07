import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initDb } from './src/services/database/db';

export default function App() {
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot(): Promise<void> {
      try {
        await initDb();
        if (!cancelled) setReady(true);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to initialize database.';
        if (!cancelled) setInitError(message);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  if (initError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>CNSDR</Text>
        <Text style={styles.subtitle}>Reflect on your decisions.</Text>
        <Text style={styles.errorTitle}>Startup error</Text>
        <Text style={styles.errorBody}>{initError}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loading}>Preparing your space…</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  loading: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
  },
  errorBody: {
    marginTop: 6,
    fontSize: 13,
    color: '#991B1B',
    paddingHorizontal: 24,
    textAlign: 'center',
  },
});

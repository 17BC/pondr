import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { MainNavigator } from './MainNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';

export function RootNavigator(): React.JSX.Element {
  const c = colors.light;
  const status = useOnboardingStore((s) => s.status);
  const refresh = useOnboardingStore((s) => s.refresh);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <NavigationContainer>
      {status === 'loading' ? (
        <View style={[styles.loadingContainer, { backgroundColor: c.background }]}>
          <ActivityIndicator size="large" />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>Preparing your space…</Text>
        </View>
      ) : status === 'needs_onboarding' ? (
        <OnboardingNavigator />
      ) : (
        <MainNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});

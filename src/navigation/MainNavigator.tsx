import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { MainStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import { QuickLogScreen } from '../screens/QuickLogScreen';
import { DecisionDetailsScreen } from '../screens/DecisionDetailsScreen';
import { DecisionEditScreen } from '../screens/DecisionEditScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="QuickLog"
        component={QuickLogScreen}
        options={{
          title: 'Quick Log',
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="DecisionDetails" component={DecisionDetailsScreen} options={{ title: 'Details' }} />
      <Stack.Screen name="DecisionEdit" component={DecisionEditScreen} options={{ title: 'Edit' }} />
    </Stack.Navigator>
  );
}

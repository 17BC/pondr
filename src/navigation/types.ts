export type RootStackParamList = {
  Tabs: undefined;
  QuickLog: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  QuickLog: undefined;
  DecisionDetails: { decisionId: string };
  DecisionEdit: { decisionId: string };
  PONDRPlus: { entry?: 'settings' | 'gated' | 'other' } | undefined;
  MonthlyReflection: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Values: undefined;
  Privacy: undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Insights: undefined;
  Review: { devAction?: 'generate_last_week' } | undefined;
  Settings: undefined;
};

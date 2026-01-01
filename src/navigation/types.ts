export type RootStackParamList = {
  Tabs: undefined;
  QuickLog: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  QuickLog: undefined;
  DecisionDetails: { decisionId: string };
  DecisionEdit: { decisionId: string };
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
  Review: undefined;
  Settings: undefined;
};

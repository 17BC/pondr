import { create } from 'zustand';

import { getOnboardingComplete, setOnboardingComplete } from '../storage/cnsdrStorage';

type OnboardingStatus = 'loading' | 'needs_onboarding' | 'complete';

type OnboardingState = {
  status: OnboardingStatus;
  refresh: () => Promise<void>;
  complete: () => Promise<void>;
  reset: () => Promise<void>;
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  status: 'loading',

  refresh: async () => {
    set({ status: 'loading' });
    const complete = await getOnboardingComplete();
    set({ status: complete ? 'complete' : 'needs_onboarding' });
  },

  complete: async () => {
    await setOnboardingComplete(true);
    set({ status: 'complete' });
  },

  reset: async () => {
    await setOnboardingComplete(false);
    set({ status: 'needs_onboarding' });
  },
}));

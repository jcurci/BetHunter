import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_FLOW_COMPLETED_KEY = '@BetHunter:onboarding_flow_completed';

export async function getOnboardingFlowCompleted(): Promise<boolean> {
  const v = await AsyncStorage.getItem(ONBOARDING_FLOW_COMPLETED_KEY);
  return v === 'true';
}

export async function setOnboardingFlowCompleted(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_FLOW_COMPLETED_KEY, 'true');
}

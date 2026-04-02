import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@bethunter_onboarding_completed';

export async function isOnboardingFlowCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEY);
  return value === 'true';
}

export async function setOnboardingFlowCompleted(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}

export async function resetOnboardingFlow(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

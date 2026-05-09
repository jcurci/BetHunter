import AsyncStorage from '@react-native-async-storage/async-storage';

const COMPLETED_KEY = '@bethunter_onboarding_completed';

/** Rascunho: passo atual, quiz, recompensas locais (OnboardingContext). */
export const ONBOARDING_DRAFT_KEY = '@bethunter_onboarding';

export async function isOnboardingFlowCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(COMPLETED_KEY);
  return value === 'true';
}

export async function setOnboardingFlowCompleted(): Promise<void> {
  await AsyncStorage.setItem(COMPLETED_KEY, 'true');
}

export async function resetOnboardingFlow(): Promise<void> {
  await AsyncStorage.removeItem(COMPLETED_KEY);
}

/**
 * Limpa o rascunho e a flag "concluído" no aparelho.
 * Use após cadastro para o novo usuário não herdar passo/conquistas de outra sessão.
 */
export async function resetLocalOnboardingStateForNewAccount(): Promise<void> {
  await AsyncStorage.multiRemove([COMPLETED_KEY, ONBOARDING_DRAFT_KEY]);
}

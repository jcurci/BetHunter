/**
 * Usuário para armazenamento no authStore (sem timestamps)
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  points: number;
  betcoins: number;
  /** undefined = sessão antiga persistida antes do rollout deste campo; usar fallback local. */
  onboardingCompleted?: boolean;
}

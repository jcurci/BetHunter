/**
 * Usuário para armazenamento no authStore (sem timestamps)
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  points: number;
  betcoins: number;
}

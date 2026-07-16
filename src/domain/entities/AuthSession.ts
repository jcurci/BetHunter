/**
 * User retornado pela API de login (id, name, email, energy, app_streak).
 */
export interface LoginUser {
  id: string;
  name: string;
  email: string;
  energy?: number;
  app_streak?: number;
  onboarding_completed?: boolean;
}

export interface AuthSession {
  accessToken: string;
  user?: LoginUser;
}

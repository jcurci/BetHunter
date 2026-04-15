import { AuthSession } from "../entities/AuthSession"

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthSession>
  loginWithGoogle(idToken: string): Promise<AuthSession>
  requestPasswordChange(email: string): Promise<void>
  verifyPasswordChangeCode(email: string, code: string): Promise<void>
  confirmPasswordChange(email: string, code: string, newPassword: string): Promise<void>
}
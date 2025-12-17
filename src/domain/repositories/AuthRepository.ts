import { AuthSession } from "../entities/AuthSession"

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthSession>
}
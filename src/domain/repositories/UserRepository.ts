import { User, UserCredentials, UserRegistration, LoginResult, VerificationCodeRequest } from '../entities/User';

export interface UserRepository {
  login(credentials: UserCredentials): Promise<LoginResult>;
  sendVerificationCode(data: VerificationCodeRequest): Promise<void>;
  verifyEmail(email: string, code: string): Promise<void>;
  createPassword(email: string, password: string): Promise<User>;
  getCurrentUser(): Promise<User | null>;
  updateUserPoints(userId: string, points: number): Promise<User>;
  logout(): Promise<void>;
}

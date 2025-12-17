import { User, UserCredentials, UserRegistration, LoginResult } from '../entities/User';

export interface UserRepository {
  login(credentials: UserCredentials): Promise<LoginResult>;
  register(userData: UserRegistration): Promise<User>;
  getCurrentUser(): Promise<User | null>;
  updateUserPoints(userId: string, points: number): Promise<User>;
  logout(): Promise<void>;
}

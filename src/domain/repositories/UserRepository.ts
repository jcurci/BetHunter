import { User, UserCredentials, UserRegistration } from '../entities/User';

export interface UserRepository {
  login(credentials: UserCredentials): Promise<User>;
  register(userData: UserRegistration): Promise<User>;
  getCurrentUser(): Promise<User | null>;
  updateUserPoints(userId: string, points: number): Promise<User>;
  logout(): Promise<void>;
} 
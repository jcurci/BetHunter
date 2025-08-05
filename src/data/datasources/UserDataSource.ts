import { User, UserCredentials, UserRegistration } from '../../domain/entities/User';

export interface UserDataSource {
  login(credentials: UserCredentials): Promise<User>;
  register(userData: UserRegistration): Promise<User>;
  getCurrentUser(): Promise<User | null>;
  updateUserPoints(userId: string, points: number): Promise<User>;
  logout(): Promise<void>;
} 
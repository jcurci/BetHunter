import { User, UserCredentials, UserRegistration } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { UserDataSource } from '../datasources/UserDataSource';

export class UserRepositoryImpl implements UserRepository {
  constructor(private userDataSource: UserDataSource) {}

  async login(credentials: UserCredentials): Promise<User> {
    return await this.userDataSource.login(credentials);
  }

  async register(userData: UserRegistration): Promise<User> {
    return await this.userDataSource.register(userData);
  }

  async getCurrentUser(): Promise<User | null> {
    return await this.userDataSource.getCurrentUser();
  }

  async updateUserPoints(userId: string, points: number): Promise<User> {
    return await this.userDataSource.updateUserPoints(userId, points);
  }

  async logout(): Promise<void> {
    return await this.userDataSource.logout();
  }
} 
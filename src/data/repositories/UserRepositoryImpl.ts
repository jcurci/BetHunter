import { User, UserCredentials, UserRegistration, LoginResult } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { UserDataSource } from '../datasources/UserDataSource';

export class UserRepositoryImpl implements UserRepository {
  constructor(private userDataSource: UserDataSource) {}

  async login(credentials: UserCredentials): Promise<LoginResult> {
    return await this.userDataSource.login(credentials);
  }

  async sendVerificationCode(data: VerificationCodeRequest): Promise<void> {
    return await this.userDataSource.sendVerificationCode(data);
  }

  async verifyEmail(email: string, code: string): Promise<void> {
    return await this.userDataSource.verifyEmail(email, code);
  }

  async createPassword(email: string, password: string): Promise<User> {
    return await this.userDataSource.createPassword(email, password);
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

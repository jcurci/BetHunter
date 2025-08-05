import { User, UserCredentials, UserRegistration } from '../entities/User';
import { UserRepository } from '../repositories/UserRepository';

export class UserUseCase {
  constructor(private userRepository: UserRepository) {}

  async login(credentials: UserCredentials): Promise<User> {
    return await this.userRepository.login(credentials);
  }

  async register(userData: UserRegistration): Promise<User> {
    return await this.userRepository.register(userData);
  }

  async getCurrentUser(): Promise<User | null> {
    return await this.userRepository.getCurrentUser();
  }

  async updateUserPoints(userId: string, points: number): Promise<User> {
    return await this.userRepository.updateUserPoints(userId, points);
  }

  async logout(): Promise<void> {
    return await this.userRepository.logout();
  }
} 
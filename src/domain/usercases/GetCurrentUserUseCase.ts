import { UserRepository } from '../repositories/UserRepository';
import { UserProfile } from '../entities/UserProfile';

export class GetCurrentUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: string): Promise<UserProfile> {
    return this.userRepository.getById(userId);
  }
}

import { UserRepository } from '../repositories/UserRepository';

export class CompleteOnboardingUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(): Promise<void> {
    return this.userRepository.completeOnboarding();
  }
}

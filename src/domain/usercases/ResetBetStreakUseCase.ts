import { BetStreakRepository } from '../repositories/BetStreakRepository';

export class ResetBetStreakUseCase {
  constructor(private betStreakRepository: BetStreakRepository) {}

  async execute(): Promise<{ success: boolean }> {
    return this.betStreakRepository.reset();
  }
}

import { BetStreakRepository } from '../repositories/BetStreakRepository';
import { BetStreakDuration } from '../entities/BetStreakDuration';

export class GetBetStreakUseCase {
  constructor(private betStreakRepository: BetStreakRepository) {}

  async execute(): Promise<BetStreakDuration> {
    return this.betStreakRepository.getBetStreak();
  }
}

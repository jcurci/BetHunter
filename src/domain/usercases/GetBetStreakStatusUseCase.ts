import { BetStreakRepository } from '../repositories/BetStreakRepository';
import { BetCheckInStatus } from '../entities/BetCheckInStatus';

export class GetBetStreakStatusUseCase {
  constructor(private betStreakRepository: BetStreakRepository) {}

  async execute(): Promise<BetCheckInStatus> {
    return this.betStreakRepository.getStatus();
  }
}

import { BetStreakRepository } from '../repositories/BetStreakRepository';
import { BetCheckInResult } from '../entities/BetCheckInResult';

export class BetCheckInUseCase {
  constructor(private betStreakRepository: BetStreakRepository) {}

  async execute(): Promise<BetCheckInResult> {
    return this.betStreakRepository.checkIn();
  }
}

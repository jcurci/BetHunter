import { BetStreakRepository } from '../../repositories/BetStreakRepository';
import { BetStreakDuration } from '../../entities/BetStreakDuration';
import { BetStreakApi } from '../../../infrastructure/services/BetStreak.api';

export class BetStreakRepositoryImpl implements BetStreakRepository {
  constructor(private betStreakApi: BetStreakApi) {}

  async getBetStreak(): Promise<BetStreakDuration> {
    return await this.betStreakApi.getBetStreak();
  }

  async reset(): Promise<{ success: boolean }> {
    return await this.betStreakApi.reset();
  }
}

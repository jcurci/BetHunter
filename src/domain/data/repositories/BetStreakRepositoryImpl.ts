import { BetStreakRepository } from '../../repositories/BetStreakRepository';
import { BetStreakApi } from '../../../infrastructure/services/BetStreak.api';

export class BetStreakRepositoryImpl implements BetStreakRepository {
  constructor(private betStreakApi: BetStreakApi) {}

  async checkIn() {
    return await this.betStreakApi.checkIn();
  }
}

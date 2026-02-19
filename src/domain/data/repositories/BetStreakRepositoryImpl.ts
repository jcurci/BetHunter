import { BetStreakRepository } from '../../repositories/BetStreakRepository';
import { BetStreakApi } from '../../../infrastructure/services/BetStreak.api';

export class BetStreakRepositoryImpl implements BetStreakRepository {
  constructor(private betStreakApi: BetStreakApi) {}

  async getStatus() {
    return await this.betStreakApi.getStatus();
  }

  async checkIn() {
    return await this.betStreakApi.checkIn();
  }

  async reset() {
    return await this.betStreakApi.reset();
  }
}

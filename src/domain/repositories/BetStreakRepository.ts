import { BetStreakDuration } from '../entities/BetStreakDuration';

export interface BetStreakRepository {
  getBetStreak(): Promise<BetStreakDuration>;
  reset(): Promise<{ success: boolean }>;
}

import { BetCheckInResult } from '../entities/BetCheckInResult';
import { BetCheckInStatus } from '../entities/BetCheckInStatus';

export interface BetStreakRepository {
  getStatus(): Promise<BetCheckInStatus>;
  checkIn(): Promise<BetCheckInResult>;
  reset(): Promise<{ success: boolean }>;
}

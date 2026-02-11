import { BetCheckInResult } from '../entities/BetCheckInResult';

export interface BetStreakRepository {
  checkIn(): Promise<BetCheckInResult>;
}

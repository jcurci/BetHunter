import { BetStreakDuration } from './BetStreakDuration';

export interface BetCheckInResult {
  betStreak: BetStreakDuration;
  nextCheckInAt: string;
}

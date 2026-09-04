import { BetStreakDuration } from './BetStreakDuration';

export interface BetCheckInStatus {
  betStreak: BetStreakDuration;
  canCheckIn: boolean;
  nextCheckInAt: string | null;
}

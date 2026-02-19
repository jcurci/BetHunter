export interface BetCheckInStatus {
  betStreak: number;
  canCheckIn: boolean;
  nextCheckInAt: string | null;
}

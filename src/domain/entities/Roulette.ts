export interface RouletteSector {
  id: number;
  label: string;
  color: string;
  points: number;
}

export interface RouletteResult {
  sector: RouletteSector;
  pointsWon: number;
  timestamp: Date;
}

export interface RouletteGame {
  id: string;
  userId: string;
  cost: number;
  result: RouletteResult;
  createdAt: Date;
} 
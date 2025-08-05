import { RouletteGame, RouletteSector } from '../entities/Roulette';

export interface RouletteRepository {
  getSectors(): Promise<RouletteSector[]>;
  playGame(userId: string, cost: number): Promise<RouletteGame>;
  getUserGames(userId: string): Promise<RouletteGame[]>;
} 
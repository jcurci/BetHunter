import { RouletteGame, RouletteSector } from '../../domain/entities/Roulette';

export interface RouletteDataSource {
  getSectors(): Promise<RouletteSector[]>;
  playGame(userId: string, cost: number): Promise<RouletteGame>;
  getUserGames(userId: string): Promise<RouletteGame[]>;
} 
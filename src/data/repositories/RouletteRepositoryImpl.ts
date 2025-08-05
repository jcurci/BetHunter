import { RouletteGame, RouletteSector } from '../../domain/entities/Roulette';
import { RouletteRepository } from '../../domain/repositories/RouletteRepository';
import { RouletteDataSource } from '../datasources/RouletteDataSource';

export class RouletteRepositoryImpl implements RouletteRepository {
  constructor(private rouletteDataSource: RouletteDataSource) {}

  async getSectors(): Promise<RouletteSector[]> {
    return await this.rouletteDataSource.getSectors();
  }

  async playGame(userId: string, cost: number): Promise<RouletteGame> {
    return await this.rouletteDataSource.playGame(userId, cost);
  }

  async getUserGames(userId: string): Promise<RouletteGame[]> {
    return await this.rouletteDataSource.getUserGames(userId);
  }
} 
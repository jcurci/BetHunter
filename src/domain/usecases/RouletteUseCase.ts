import { RouletteGame, RouletteSector } from '../entities/Roulette';
import { RouletteRepository } from '../repositories/RouletteRepository';

export class RouletteUseCase {
  constructor(private rouletteRepository: RouletteRepository) {}

  async getSectors(): Promise<RouletteSector[]> {
    return await this.rouletteRepository.getSectors();
  }

  async playGame(userId: string, cost: number): Promise<RouletteGame> {
    return await this.rouletteRepository.playGame(userId, cost);
  }

  async getUserGames(userId: string): Promise<RouletteGame[]> {
    return await this.rouletteRepository.getUserGames(userId);
  }
} 
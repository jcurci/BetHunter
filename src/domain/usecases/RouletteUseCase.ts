import { RouletteGame, RouletteSector } from '../entities/Roulette';
import { RouletteRepository } from '../repositories/RouletteRepository';
import { ValidationError, InsufficientBalanceError } from '../errors/CustomErrors';

export class RouletteUseCase {
  constructor(private rouletteRepository: RouletteRepository) {}

  async getSectors(): Promise<RouletteSector[]> {
    return await this.rouletteRepository.getSectors();
  }

  /**
   * Joga a roleta
   * @throws ValidationError se userId ou cost forem inválidos
   * @throws InsufficientBalanceError se usuário não tiver pontos suficientes
   */
  async playGame(userId: string, cost: number, userPoints: number): Promise<RouletteGame> {
    // Validação de entrada
    if (!userId || userId.trim() === '') {
      throw new ValidationError('ID do usuário é obrigatório');
    }

    if (cost <= 0) {
      throw new ValidationError('Custo deve ser maior que zero');
    }

    if (!Number.isInteger(cost)) {
      throw new ValidationError('Custo deve ser um número inteiro');
    }

    // Validação de saldo suficiente
    if (userPoints < cost) {
      throw new InsufficientBalanceError(
        `Saldo insuficiente. Você tem ${userPoints} pontos mas precisa de ${cost} pontos para jogar.`
      );
    }

    return await this.rouletteRepository.playGame(userId, cost);
  }

  /**
   * Busca jogos do usuário
   * @throws ValidationError se userId for inválido
   */
  async getUserGames(userId: string): Promise<RouletteGame[]> {
    if (!userId || userId.trim() === '') {
      throw new ValidationError('ID do usuário é obrigatório');
    }

    return await this.rouletteRepository.getUserGames(userId);
  }
} 
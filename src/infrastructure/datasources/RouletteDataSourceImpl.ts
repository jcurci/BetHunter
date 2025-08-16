import { RouletteGame, RouletteSector } from '../../domain/entities/Roulette';
import { RouletteDataSource } from '../../data/datasources/RouletteDataSource';

export class RouletteDataSourceImpl implements RouletteDataSource {
  async getSectors(): Promise<RouletteSector[]> {
    return [
      { id: 0, label: "10 pts", color: "#FFD700", points: 10 }, // amarelo dourado
      { id: 1, label: "20 pts", color: "#FF6B35", points: 20 }, // laranja vibrante
      { id: 2, label: "30 pts", color: "#E91E63", points: 30 }, // rosa vibrante
      { id: 3, label: "0 pts", color: "#8B5CF6", points: 0 },   // roxo
      { id: 4, label: "50 pts", color: "#FF6B35", points: 50 }, // laranja vibrante
      { id: 5, label: "40 pts", color: "#4CAF50", points: 40 }, // verde vibrante
      { id: 6, label: "30 pts", color: "#2196F3", points: 30 }, // azul vibrante
      { id: 7, label: "20 pts", color: "#FF9800", points: 20 }, // laranja dourado
    ];
  }

  async playGame(userId: string, cost: number): Promise<RouletteGame> {
    const sectors = await this.getSectors();
    const randomSector = sectors[Math.floor(Math.random() * sectors.length)];
    
    const game: RouletteGame = {
      id: Date.now().toString(),
      userId,
      cost,
      result: {
        sector: randomSector,
        pointsWon: randomSector.points,
        timestamp: new Date(),
      },
      createdAt: new Date(),
    };

    return game;
  }

  async getUserGames(userId: string): Promise<RouletteGame[]> {
    // Simulação - em produção seria uma chamada para API
    return [];
  }
} 
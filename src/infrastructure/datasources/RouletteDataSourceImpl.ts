import { RouletteGame, RouletteSector } from '../../domain/entities/Roulette';
import { RouletteDataSource } from '../../data/datasources/RouletteDataSource';

export class RouletteDataSourceImpl implements RouletteDataSource {
  async getSectors(): Promise<RouletteSector[]> {
    return [
      { id: 0, label: "10 pts", color: "#FFD93D", points: 10 }, // amarelo
      { id: 1, label: "20 pts", color: "#FF8C43", points: 20 }, // laranja
      { id: 2, label: "30 pts", color: "#A66CFF", points: 30 }, // roxo claro
      { id: 3, label: "40 pts", color: "#4D2C91", points: 40 }, // roxo escuro
      { id: 4, label: "50 pts", color: "#FF8C43", points: 50 }, // laranja
      { id: 5, label: "0 pts", color: "#6C3DD1", points: 0 },   // roxo médio
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
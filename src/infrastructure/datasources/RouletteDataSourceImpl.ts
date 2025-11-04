import { RouletteGame, RouletteSector } from '../../domain/entities/Roulette';
import { RouletteDataSource } from '../../data/datasources/RouletteDataSource';
import { apiClient } from '../../services/api/apiClient';

export class RouletteDataSourceImpl implements RouletteDataSource {
  /**
   * Busca setores da roleta da API
   * Fallback para dados mockados se API falhar
   */
  async getSectors(): Promise<RouletteSector[]> {
    try {
      const response = await apiClient.get('/roulette/sectors');
      console.log('✅ [RouletteDataSource] Setores carregados da API');
      return response.data;
    } catch (error) {
      console.warn('⚠️ [RouletteDataSource] API indisponível, usando dados mockados');
      
      // Fallback para dados mockados
      return [
        { id: 0, label: "10 pts", color: "#FFD700", points: 10 },
        { id: 1, label: "20 pts", color: "#FF6B35", points: 20 },
        { id: 2, label: "30 pts", color: "#E91E63", points: 30 },
        { id: 3, label: "0 pts", color: "#8B5CF6", points: 0 },
        { id: 4, label: "50 pts", color: "#FF6B35", points: 50 },
        { id: 5, label: "40 pts", color: "#4CAF50", points: 40 },
        { id: 6, label: "30 pts", color: "#2196F3", points: 30 },
        { id: 7, label: "20 pts", color: "#FF9800", points: 20 },
      ];
    }
  }

  /**
   * Joga a roleta via API
   * Fallback para lógica local se API falhar
   */
  async playGame(userId: string, cost: number): Promise<RouletteGame> {
    try {
      const response = await apiClient.post('/roulette/play', {
        userId,
        cost,
      });
      
      console.log('✅ [RouletteDataSource] Jogo realizado via API');
      return response.data;
    } catch (error) {
      console.warn('⚠️ [RouletteDataSource] API indisponível, usando lógica local');
      
      // Fallback para lógica local
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
  }

  /**
   * Busca histórico de jogos do usuário
   */
  async getUserGames(userId: string): Promise<RouletteGame[]> {
    try {
      const response = await apiClient.get(`/roulette/games/${userId}`);
      console.log('✅ [RouletteDataSource] Jogos do usuário carregados da API');
      return response.data;
    } catch (error) {
      console.warn('⚠️ [RouletteDataSource] API indisponível, retornando lista vazia');
      return [];
    }
  }
} 
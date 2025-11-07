import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
  points: number;
}

const TOKEN_KEY = '@BetHunter:token';
const USER_KEY = '@BetHunter:user';

/**
 * AuthStorageService - Camada Infrastructure
 * Responsável por gerenciar autenticação (token e user) no AsyncStorage
 * Segue Clean Architecture: Infrastructure Layer não conhece UI/Zustand
 */
export class AuthStorageService {
  /**
   * Salva token e usuário no storage
   */
  async login(token: string, user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      
      console.log('✅ [AuthStorageService] Login salvo');
      console.log('🔑 Token:', token.substring(0, 20) + '...');
      console.log('👤 User:', user.email);
    } catch (error) {
      console.error('❌ [AuthStorageService] Erro ao salvar login:', error);
      throw error;
    }
  }

  /**
   * Remove token e usuário do storage
   */
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      
      console.log('✅ [AuthStorageService] Logout realizado');
    } catch (error) {
      console.error('❌ [AuthStorageService] Erro ao fazer logout:', error);
      throw error;
    }
  }

  /**
   * Busca token do storage
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('❌ [AuthStorageService] Erro ao buscar token:', error);
      return null;
    }
  }

  /**
   * Busca usuário do storage
   */
  async getUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      if (!userJson) return null;
      
      return JSON.parse(userJson);
    } catch (error) {
      console.error('❌ [AuthStorageService] Erro ao buscar usuário:', error);
      return null;
    }
  }

  /**
   * Atualiza pontos do usuário
   */
  async updateUserPoints(points: number): Promise<void> {
    try {
      const user = await this.getUser();
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const updatedUser = { ...user, points };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      
      console.log('✅ [AuthStorageService] Pontos atualizados:', points);
    } catch (error) {
      console.error('❌ [AuthStorageService] Erro ao atualizar pontos:', error);
      throw error;
    }
  }

  /**
   * Verifica se usuário está autenticado
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }
}








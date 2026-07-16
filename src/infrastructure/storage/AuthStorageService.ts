import AsyncStorage from '@react-native-async-storage/async-storage';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  points: number;
  betcoins: number;
  onboardingCompleted?: boolean;
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
  async login(token: string, user: StoredUser): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
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
  async getUser(): Promise<StoredUser | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      if (!userJson) return null;

      const parsed = JSON.parse(userJson) as Partial<StoredUser>;

      return {
        id: parsed.id ?? "",
        name: parsed.name ?? "",
        email: parsed.email ?? "",
        points: parsed.points ?? 0,
        betcoins: parsed.betcoins ?? 0,
        // Sem default: undefined preserva o fallback local em App.tsx/Login.tsx
        // para sessões persistidas antes deste campo existir.
        onboardingCompleted: parsed.onboardingCompleted,
      };
    } catch (error) {
      console.error('❌ [AuthStorageService] Erro ao buscar usuário:', error);
      return null;
    }
  }

  /**
   * Sobrescreve o usuário salvo (mantém o token intacto). Usado quando algum
   * campo do usuário muda em memória e precisa sobreviver a um restart do app.
   */
  async updateUser(user: StoredUser): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('❌ [AuthStorageService] Erro ao atualizar usuário:', error);
      throw error;
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

      const updatedUser: StoredUser = {
        ...user,
        points,
        betcoins: user.betcoins ?? 0,
      };
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








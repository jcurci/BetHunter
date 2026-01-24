import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStorageService } from '../infrastructure/storage/AuthStorageService';
import { setOnTokenExpired, clearOnTokenExpired } from '../services/api/apiClient';
import { AuthUser } from '../domain/entities/User';

const TOKEN_KEY = '@BetHunter:token';

/**
 * Interface do AuthStore
 */
interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  
  // Actions
  setToken: (token: string) => Promise<void>;
  setUser: (user: AuthUser) => void;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  initialize: () => Promise<void>;
}

// Instância do AuthStorageService (Infrastructure Layer)
const authStorageService = new AuthStorageService();

/**
 * AuthStore - Estado reativo de autenticação
 * Usa Zustand para gerenciamento de estado
 * Conecta com apiClient via callback para logout automático em 401
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setToken: async (token: string) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      console.log('✅ [AuthStore] Token salvo no AsyncStorage');
    } catch (error) {
      console.error('❌ [AuthStore] Erro ao salvar token no AsyncStorage:', error);
    }
    set({ token, isAuthenticated: true });
  },

  setUser: (user: AuthUser) => {
    set({ user });
  },

  /**
   * Realiza login e salva credenciais
   */
  login: async (token: string, user: AuthUser) => {
    try {
      await authStorageService.login(token, user);
      
      console.log('✅ [AuthStore] Login realizado');
      
      set({
        token,
        user,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('❌ [AuthStore] Erro ao fazer login:', error);
      throw error;
    }
  },

  /**
   * Realiza logout e limpa credenciais
   */
  logout: async () => {
    try {
      await authStorageService.logout();
      
      console.log('✅ [AuthStore] Logout realizado');
      
      set({
        token: null,
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('❌ [AuthStore] Erro ao fazer logout:', error);
      throw error;
    }
  },

  /**
   * Carrega autenticação do storage
   */
  loadAuth: async () => {
    try {
      const token = await authStorageService.getToken();
      const user = await authStorageService.getUser();
      
      if (token && user) {
        console.log('✅ [AuthStore] Autenticação carregada');
        
        set({
          token,
          user,
          isAuthenticated: true,
        });
      } else {
        console.log('ℹ️ [AuthStore] Nenhuma autenticação encontrada');
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('❌ [AuthStore] Erro ao carregar autenticação:', error);
      set({
        token: null,
        user: null,
        isAuthenticated: false,
      });
    }
  },

  /**
   * Inicializa o AuthStore
   * - Carrega autenticação do storage
   * - Registra callback para token expirado (401)
   */
  initialize: async () => {
    if (get().isInitialized) return;

    // Registrar callback para quando token expirar (401)
    // Isso conecta apiClient com authStore sem violar Clean Architecture
    setOnTokenExpired(() => {
      console.log('⚠️ [AuthStore] Token expirado, realizando logout automático');
      get().logout();
    });

    // Carregar autenticação existente
    await get().loadAuth();

    set({ isInitialized: true });
    console.log('✅ [AuthStore] Inicializado');
  },
}));

/**
 * Função para limpar callback ao desmontar app (cleanup)
 */
export const cleanupAuthStore = (): void => {
  clearOnTokenExpired();
};

import { create } from 'zustand';
import { AuthStorageService } from '../infrastructure/storage/AuthStorageService';

interface User {
  id: string;
  name: string;
  email: string;
  points: number;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  
  // Actions
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

// Instância do AuthStorageService para sincronização
const authStorageService = new AuthStorageService();

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setToken: (token: string) => {
    set({ token, isAuthenticated: true });
  },

  setUser: (user: User) => {
    set({ user });
  },

  login: async (token: string, user: User) => {
    try {
      // Salvar via AuthStorageService (Infrastructure Layer)
      await authStorageService.login(token, user);
      
      console.log('✅ [AuthStore] Estado atualizado após login');
      
      // Atualizar estado reativo da UI
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

  logout: async () => {
    try {
      // Limpar via AuthStorageService (Infrastructure Layer)
      await authStorageService.logout();
      
      console.log('✅ [AuthStore] Estado limpo após logout');
      
      // Atualizar estado reativo da UI
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

  loadAuth: async () => {
    try {
      // Carregar via AuthStorageService (Infrastructure Layer)
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
}));





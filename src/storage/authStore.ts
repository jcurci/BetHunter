import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  setToken: (token: string) => Promise<void>;
  setUser: (user: User) => Promise<void>;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

const TOKEN_KEY = '@BetHunter:token';
const USER_KEY = '@BetHunter:user';

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setToken: async (token: string) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      console.log('✅ Token salvo no authStore:', token);
      set({ token, isAuthenticated: true });
    } catch (error) {
      console.error('❌ Erro ao salvar token:', error);
      throw error;
    }
  },

  setUser: async (user: User) => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      console.log('✅ Usuário salvo no authStore:', user);
      set({ user });
    } catch (error) {
      console.error('❌ Erro ao salvar usuário:', error);
      throw error;
    }
  },

  login: async (token: string, user: User) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      
      console.log('✅ Login salvo no authStore');
      console.log('🔑 Token:', token);
      console.log('👤 User:', user);
      
      set({
        token,
        user,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('❌ Erro ao fazer login no authStore:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      
      console.log('✅ Logout realizado no authStore');
      
      set({
        token: null,
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
      throw error;
    }
  },

  loadAuth: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userJson = await AsyncStorage.getItem(USER_KEY);
      
      if (token && userJson) {
        const user = JSON.parse(userJson);
        
        console.log('✅ Autenticação carregada do authStore');
        console.log('🔑 Token:', token);
        console.log('👤 User:', user);
        
        set({
          token,
          user,
          isAuthenticated: true,
        });
      } else {
        console.log('ℹ️ Nenhuma autenticação encontrada');
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar autenticação:', error);
      set({
        token: null,
        user: null,
        isAuthenticated: false,
      });
    }
  },
}));



import { User, UserCredentials, UserRegistration } from '../../domain/entities/User';
import { UserDataSource } from '../../data/datasources/UserDataSource';
import { StorageService } from '../storage/StorageService';
import { authService } from '../../services/auth/authService';
import { decode as base64Decode } from 'base-64';
import { useAuthStore } from '../../storage/authStore';

// Helper function to manually decode JWT (works in React Native)
const decodeJWT = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token JWT inválido');
    }
    
    // Decodificar a parte do payload (parte 2)
    const payload = parts[1];
    // Adicionar padding se necessário
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = base64Decode(paddedPayload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error);
    throw new Error('Erro ao decodificar token');
  }
};

export class UserDataSourceImpl implements UserDataSource {
  constructor(private storageService: StorageService) {}

  async login(credentials: UserCredentials): Promise<User> {
    try {
      // Chamar API real para login
      const response = await authService.login(credentials);
      
      console.log('Response do login:', response);
      console.log('🔑 TOKEN RECEBIDO:', response?.token);
      
      // Verificar se o token existe
      if (!response?.token) {
        throw new Error('Token não retornado pelo servidor');
      }
      
      // Decodificar JWT para extrair dados do usuário
      const decoded = decodeJWT(response.token);
      console.log('Token decodificado:', decoded);
      
      // Criar objeto User com dados do token e fallbacks
      const user: User = {
        id: decoded?.sub || credentials.email,
        email: decoded?.sub || credentials.email,
        name: 'Usuário', // temporário até backend retornar dados completos
        points: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Salvar APENAS no authStore (Zustand com persistência)
      const authStore = useAuthStore.getState();
      await authStore.login(response.token, {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points,
      });
      
      return user;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  async register(userData: UserRegistration): Promise<User> {
    try {
      // Chamar API real para registro
      const response = await authService.register(userData);
      
      console.log('Response do registro:', response);
      
      // Backend não retorna token no registro, apenas confirma criação
      // Criar objeto User temporário apenas para retornar sucesso
      const user: User = {
        id: userData.email,
        email: userData.email,
        name: userData.name,
        points: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('User registrado:', user);
      
      return user;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const userData = await this.storageService.getItem('currentUser');
    if (!userData) return null;
    return JSON.parse(userData);
  }

  async updateUserPoints(userId: string, points: number): Promise<User> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not found');

    const updatedUser: User = {
      ...currentUser,
      points,
      updatedAt: new Date(),
    };

    await this.storageService.setItem('currentUser', JSON.stringify(updatedUser));
    return updatedUser;
  }

  async logout(): Promise<void> {
    try {
      // Limpar APENAS authStore (que já limpa o AsyncStorage)
      const authStore = useAuthStore.getState();
      await authStore.logout();
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  }
} 
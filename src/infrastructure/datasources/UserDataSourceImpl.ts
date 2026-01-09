import { User, UserCredentials, UserRegistration, LoginResult, VerificationCodeRequest } from '../../domain/entities/User';
import { UserDataSource } from '../../data/datasources/UserDataSource';
import { AuthStorageService } from '../storage/AuthStorageService';
import { apiClient } from '../../services/api/apiClient';
import { decode as base64Decode } from 'base-64';

/**
 * Interface para resposta de login da API
 */
interface LoginResponse {
  token: string;
}

/**
 * Interface para resposta de registro da API
 */
interface RegisterResponse {
  id: string;
  email: string;
  name: string;
  cellphone: string;
  betcoins: number;
  ranking_points: number;
}

/**
 * Helper function to decode JWT payload
 * Works in React Native environment
 */
const decodeJWT = (token: string): Record<string, unknown> => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token JWT inválido');
    }
    
    const payload = parts[1];
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = base64Decode(paddedPayload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error);
    throw new Error('Erro ao decodificar token');
  }
};

/**
 * UserDataSourceImpl - Infrastructure Layer
 * Implementação concreta do UserDataSource
 * Responsável por comunicação com API e persistência local
 */
export class UserDataSourceImpl implements UserDataSource {
  constructor(private authStorageService: AuthStorageService) {}

  /**
   * Realiza login via API e salva credenciais localmente
   * @returns LoginResult com user e token para atualizar estado da UI
   */
  async login(credentials: UserCredentials): Promise<LoginResult> {
    try {
      // Normalizar email (trim e lowercase)
      const normalizedCredentials = {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      };

      const response = await apiClient.post<LoginResponse>('/auth/login', normalizedCredentials);
      
      if (!response.data?.token) {
        throw new Error('Token não retornado pelo servidor');
      }
      
      const token = response.data.token;
      const decoded = decodeJWT(token);
      console.log('✅ Token decodificado');
      
      const user: User = {
        id: (decoded?.sub as string) || normalizedCredentials.email,
        email: (decoded?.sub as string) || normalizedCredentials.email,
        name: (decoded?.name as string) || 'Usuário',
        points: (decoded?.points as number) ?? 0,
        betcoins: (decoded?.betcoins as number) ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Salvar no storage (persistência)
      await this.authStorageService.login(token, {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points,
        betcoins: user.betcoins,
      });
      
      // Retorna user E token para a UI atualizar o estado reativo
      return { user, token };
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      
      // Extrair mensagem de erro do backend se disponível
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        
        // Criar erro customizado com mensagem do backend
        const customError = new Error(errorMessage);
        (customError as any).response = error.response;
        (customError as any).status = error.response?.status;
        throw customError;
      }
      
      throw error;
    }
  }

  /**
   * Envia código de verificação por email (sem senha)
   */
  async sendVerificationCode(data: VerificationCodeRequest): Promise<void> {
    try {
      // Formatar telefone: remover todos os caracteres não numéricos
      const formattedCellphone = data.cellphone.replace(/\D/g, '');
      
      // Preparar dados para envio (sem senha)
      const requestData = {
        name: data.name.trim(),
        username: data.username.trim(),
        email: data.email.trim().toLowerCase(),
        cellphone: formattedCellphone,
      };

      await apiClient.post('/auth/register', requestData);
      
      console.log('✅ Código de verificação enviado');
    } catch (error: any) {
      console.error('❌ Erro ao enviar código de verificação:', error);
      
      // Extrair mensagem de erro do backend se disponível
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        
        // Criar erro customizado com mensagem do backend
        const customError = new Error(errorMessage);
        (customError as any).response = error.response;
        (customError as any).status = error.response?.status;
        throw customError;
      }
      
      throw error;
    }
  }

  /**
   * Verifica email com código de verificação
   */
  async verifyEmail(email: string, code: string): Promise<void> {
    try {
      await apiClient.post('/auth/register/verify', {
        email: email.trim().toLowerCase(),
        code: code.trim(),
      });
      
      console.log('✅ Email verificado');
    } catch (error: any) {
      console.error('❌ Erro ao verificar email:', error);
      
      // Extrair mensagem de erro do backend se disponível
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        
        // Criar erro customizado com mensagem do backend
        const customError = new Error(errorMessage);
        (customError as any).response = error.response;
        (customError as any).status = error.response?.status;
        throw customError;
      }
      
      throw error;
    }
  }

  /**
   * Cria senha e completa registro do usuário
   */
  async createPassword(email: string, password: string): Promise<User> {
    try {
      const response = await apiClient.post<RegisterResponse>('/auth/register/password', {
        email: email.trim().toLowerCase(),
        password: password,
      });
      
      console.log('✅ Senha criada e usuário registrado');
      
      const user: User = {
        id: response.data?.id || email,
        email: response.data?.email || email,
        name: response.data?.name || '',
        points: response.data?.ranking_points ?? 0,
        betcoins: response.data?.betcoins ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      return user;
    } catch (error: any) {
      console.error('❌ Erro ao criar senha:', error);
      
      // Extrair mensagem de erro do backend se disponível
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        
        // Criar erro customizado com mensagem do backend
        const customError = new Error(errorMessage);
        (customError as any).response = error.response;
        (customError as any).status = error.response?.status;
        throw customError;
      }
      
      throw error;
    }
  }

  /**
   * Obtém usuário atual do storage local
   */
  async getCurrentUser(): Promise<User | null> {
    const user = await this.authStorageService.getUser();
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      points: user.points,
      betcoins: user.betcoins ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Atualiza pontos do usuário no storage local
   */
  async updateUserPoints(userId: string, points: number): Promise<User> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuário não encontrado');
    }

    const updatedUser: User = {
      ...currentUser,
      points,
      updatedAt: new Date(),
    };

    await this.authStorageService.updateUserPoints(points);
    return updatedUser;
  }

  /**
   * Realiza logout limpando dados locais
   */
  async logout(): Promise<void> {
    try {
      await this.authStorageService.logout();
      console.log('✅ Logout realizado');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      throw error;
    }
  }
}

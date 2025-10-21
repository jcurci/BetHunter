import { UserCredentials } from '../../domain/entities/User';
import { apiClient } from '../api/apiClient';

export interface AuthResponse {
  token: string;
  user?: any;
}

export class AuthService {
  async login(credentials: UserCredentials): Promise<AuthResponse> {
    try {
      console.log('📤 Enviando requisição de login...');
      console.log('📧 Email:', credentials.email);
      console.log('🔒 Password:', credentials.password ? '***' + credentials.password.slice(-3) : 'undefined');
      console.log('🌐 URL:', '/auth/login');
      
      const response = await apiClient.post('/auth/login', credentials);
      
      console.log('✅ Login bem-sucedido, status:', response.status);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      console.error('📊 Status:', error.response?.status);
      console.error('📝 Mensagem:', error.response?.data);
      console.error('🔍 Headers:', error.response?.headers);
      throw error;
    }
  }

  async register(userData: any): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();

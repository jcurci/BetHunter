import { UserCredentials } from '../../domain/entities/User';
import { apiClient } from '../api/apiClient';

export interface AuthResponse {
  token: string;
  user?: any;
}

export class AuthService {
  async login(credentials: UserCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Erro no login:', error);
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

import { apiClient } from '../../services/api/apiClient';
import { UserProfile } from '../../domain/entities/UserProfile';
import { Dashboard } from '../../domain/entities/Dashboard';
import { AuthenticationError } from '../../domain/errors/CustomErrors';

export class UserApi {
  async getById(userId: string): Promise<UserProfile> {
    try {
      const url = `/users/${userId}`;
      console.log('🔗 UserApi.getById - Fazendo requisição GET para:', url);

      const response = await apiClient.get(url);

      const data = response.data;
      return {
        id: data.id,
        name: data.name ?? '',
        email: data.email ?? '',
        cellphone: data.cellphone ?? '',
        betcoins: data.betcoins ?? 0,
        ranking_points: data.ranking_points ?? 0,
        gambler: data.gambler ?? false,
      };
    } catch (error: any) {
      console.error('🚨 UserApi.getById - Erro detalhado:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
        isNetworkError: !error.response,
      });

      if (error instanceof AuthenticationError) {
        throw error;
      }

      if (!error.response) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          throw new AuthenticationError('Timeout. O servidor demorou muito para responder.');
        }
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
          throw new AuthenticationError('Erro de conexão. Verifique sua internet.');
        }
        throw new AuthenticationError('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }

      if (error.response.status === 401) {
        throw new AuthenticationError('Sessão expirada. Faça login novamente.');
      }
      if (error.response.status === 404) {
        throw new AuthenticationError('Usuário não encontrado.');
      }
      if (error.response.status === 500) {
        throw new AuthenticationError('Erro no servidor. Tente novamente mais tarde.');
      }

      throw new AuthenticationError(`Erro ao buscar usuário (${error.response.status}). Tente novamente.`);
    }
  }

  async getDashboard(): Promise<Dashboard> {
    try {
      const url = '/users/dashboard';
      console.log('🔗 UserApi.getDashboard - Fazendo requisição GET para:', url);

      const response = await apiClient.get(url);

      const data = response.data;
      return {
        energy: data.energy ?? 0,
        streak: data.streak ?? 0,
      };
    } catch (error: any) {
      console.error('🚨 UserApi.getDashboard - Erro detalhado:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
        isNetworkError: !error.response,
      });

      if (error instanceof AuthenticationError) {
        throw error;
      }

      if (!error.response) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          throw new AuthenticationError('Timeout. O servidor demorou muito para responder.');
        }
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
          throw new AuthenticationError('Erro de conexão. Verifique sua internet.');
        }
        throw new AuthenticationError('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }

      if (error.response.status === 401) {
        throw new AuthenticationError('Sessão expirada. Faça login novamente.');
      }
      if (error.response.status === 404) {
        throw new AuthenticationError('Dashboard não encontrado.');
      }
      if (error.response.status === 500) {
        throw new AuthenticationError('Erro no servidor. Tente novamente mais tarde.');
      }

      throw new AuthenticationError(`Erro ao buscar dashboard (${error.response.status}). Tente novamente.`);
    }
  }

  async completeOnboarding(): Promise<void> {
    try {
      const url = '/users/onboarding-complete';
      console.log('🔗 UserApi.completeOnboarding - Fazendo requisição POST para:', url);

      await apiClient.post(url);
    } catch (error: any) {
      console.error('🚨 UserApi.completeOnboarding - Erro detalhado:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        isNetworkError: !error.response,
      });
      throw error;
    }
  }
}

import { apiClient } from '../../services/api/apiClient';
import { BetCheckInResult } from '../../domain/entities/BetCheckInResult';
import { BetCheckInStatus } from '../../domain/entities/BetCheckInStatus';
import { AuthenticationError } from '../../domain/errors/CustomErrors';

export class BetStreakApi {
  async getStatus(): Promise<BetCheckInStatus> {
    try {
      const url = '/users/bet-checkin';
      console.log('🔗 BetStreakApi.getStatus - Fazendo requisição GET para:', url);

      const response = await apiClient.get(url);

      return {
        betStreak: response.data.betStreak,
        canCheckIn: response.data.canCheckIn,
        nextCheckInAt: response.data.nextCheckInAt,
      };
    } catch (error: any) {
      console.error('🚨 BetStreakApi.getStatus - Erro detalhado:', {
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
        throw new AuthenticationError('Endpoint não encontrado. Verifique a configuração.');
      }
      if (error.response.status === 500) {
        throw new AuthenticationError('Erro no servidor. Tente novamente mais tarde.');
      }

      throw new AuthenticationError(`Erro ao consultar streak (${error.response.status}). Tente novamente.`);
    }
  }

  async checkIn(): Promise<BetCheckInResult> {
    try {
      const url = '/users/bet-checkin';
      console.log('🔗 BetStreakApi.checkIn - Fazendo requisição para:', url);

      const response = await apiClient.post(url);

      return {
        betStreak: response.data.betStreak,
        nextCheckInAt: response.data.nextCheckInAt,
      };
    } catch (error: any) {
      console.error('🚨 BetStreakApi.checkIn - Erro detalhado:', {
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

      // Erros de rede (sem resposta do servidor)
      if (!error.response) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          throw new AuthenticationError('Timeout. O servidor demorou muito para responder.');
        }
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
          throw new AuthenticationError('Erro de conexão. Verifique sua internet.');
        }
        throw new AuthenticationError('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }

      // Check-in já realizado hoje (400)
      if (error.response.status === 400) {
        throw new AuthenticationError('Check-in já realizado hoje.');
      }
      if (error.response.status === 401) {
        throw new AuthenticationError('Sessão expirada. Faça login novamente.');
      }
      if (error.response.status === 404) {
        throw new AuthenticationError('Endpoint não encontrado. Verifique a configuração.');
      }
      if (error.response.status === 500) {
        throw new AuthenticationError('Erro no servidor. Tente novamente mais tarde.');
      }

      throw new AuthenticationError(`Erro ao fazer check-in (${error.response.status}). Tente novamente.`);
    }
  }

  async reset(): Promise<{ success: boolean }> {
    try {
      const url = '/users/bet-reset';
      console.log('🔗 BetStreakApi.reset - Fazendo requisição POST para:', url);

      const response = await apiClient.post(url);

      return {
        success: response.data.success,
      };
    } catch (error: any) {
      console.error('🚨 BetStreakApi.reset - Erro detalhado:', {
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
        throw new AuthenticationError('Endpoint não encontrado. Verifique a configuração.');
      }
      if (error.response.status === 500) {
        throw new AuthenticationError('Erro no servidor. Tente novamente mais tarde.');
      }

      throw new AuthenticationError(`Erro ao resetar streak (${error.response.status}). Tente novamente.`);
    }
  }
}

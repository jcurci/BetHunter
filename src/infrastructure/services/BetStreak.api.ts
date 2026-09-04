import { apiClient } from '../../services/api/apiClient';
import { BetCheckInResult } from '../../domain/entities/BetCheckInResult';
import { BetCheckInStatus } from '../../domain/entities/BetCheckInStatus';
import {
  BetStreakDuration,
  ZERO_BET_STREAK_DURATION,
} from '../../domain/entities/BetStreakDuration';
import { AuthenticationError } from '../../domain/errors/CustomErrors';

/** Inteiro >= 0, ou 0 se o backend mandar null/string/lixo. */
function toCount(value: any): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
}

/**
 * Normaliza o `betStreak` da API para `{ days, hours, minutes }`.
 *
 * O backend passou a devolver o objeto, mas o formato antigo era um número
 * puro. Aceitamos os dois para que um rollback do backend (ou o app apontando
 * para um ambiente ainda não atualizado) não zere o contador da Home.
 */
export function parseBetStreak(raw: any): BetStreakDuration {
  // Formato legado: dias como número puro (ou string numérica).
  if (typeof raw === 'number' || typeof raw === 'string') {
    return { ...ZERO_BET_STREAK_DURATION, days: toCount(raw) };
  }

  if (raw && typeof raw === 'object') {
    return {
      days: toCount(raw.days),
      hours: toCount(raw.hours),
      minutes: toCount(raw.minutes),
    };
  }

  return { ...ZERO_BET_STREAK_DURATION };
}

export class BetStreakApi {
  async getStatus(): Promise<BetCheckInStatus> {
    try {
      const url = '/users/bet-checkin';
      console.log('🔗 BetStreakApi.getStatus - Fazendo requisição GET para:', url);

      const response = await apiClient.get(url);

      return {
        betStreak: parseBetStreak(response.data.betStreak),
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
        betStreak: parseBetStreak(response.data.betStreak),
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

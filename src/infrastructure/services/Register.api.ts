import { apiClient } from '../../services/api/apiClient';
import { RegisterRequest } from '../../domain/entities/signup/RegisterRequest';
import { RegisterResult } from '../../domain/entities/signup/RegisterResult';
import { AuthenticationError } from '../../domain/errors/CustomErrors';

export class RegisterApi {
  async register(request: RegisterRequest): Promise<RegisterResult> {
    try {
      const url = '/auth/register';
      console.log('🔗 RegisterApi.register - Fazendo requisição para:', url);

      const response = await apiClient.post(url, {
        email: request.email,
        name: request.name,
        username: request.username,
        cellphone: request.cellphone?.trim() || undefined,
        password: request.password,
        gambler: request.gambler,
      });

      const userData = response.data;

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        cellphone: userData.cellphone ?? null,
        betcoins: userData.betcoins || 0,
        ranking_points: userData.ranking_points || 0,
        gambler: userData.gambler || false,
      };
    } catch (error: any) {
      console.error('🚨 RegisterApi.register - Erro detalhado:', {
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

      if (error.response.status === 400) {
        const message = error.response.data?.message || 'Dados inválidos';
        if (Array.isArray(message)) {
          throw new AuthenticationError(message.join(', '));
        }
        throw new AuthenticationError(message || 'Email ou telefone já cadastrado');
      }
      if (error.response.status === 404) {
        throw new AuthenticationError('Endpoint não encontrado. Verifique a configuração.');
      }
      if (error.response.status === 500) {
        throw new AuthenticationError('Erro no servidor. Tente novamente mais tarde.');
      }

      throw new AuthenticationError(`Erro ao criar conta (${error.response.status}). Tente novamente.`);
    }
  }
}

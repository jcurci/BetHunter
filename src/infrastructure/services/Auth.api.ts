import { apiClient } from '../../services/api/apiClient';
import { AuthSession } from '../../domain/entities/AuthSession';
import { AuthenticationError } from '../../domain/errors/CustomErrors';

export class AuthApi {
  async login(email: string, password: string): Promise<AuthSession> {
    try {
      // Log para debug - verificar URL completa
      const url = '/auth/login';
      console.log('🔗 AuthApi.login - Fazendo requisição para:', url);
      console.log('🔗 Base URL configurada:', (apiClient as any).defaults?.baseURL);
      console.log('🔗 URL completa:', `${(apiClient as any).defaults?.baseURL}${url}`);
      
      const response = await apiClient.post(url, {
        email,
        password,
      });

      const token = response.data.token || response.data.accessToken;

      if (!token) {
        throw new AuthenticationError('Token não recebido do servidor');
      }

      return {
        user: response.data.user || email,
        accessToken: token,
      };
    } catch (error: any) {
      // Log detalhado para debug
      console.error('🚨 AuthApi.login - Erro detalhado:', {
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

      // Erros HTTP específicos
      if (error.response.status === 400 || error.response.status === 401) {
        throw new AuthenticationError('Email ou senha inválidos');
      }
      if (error.response.status === 404) {
        throw new AuthenticationError('Endpoint não encontrado. Verifique a configuração.');
      }
      if (error.response.status === 500) {
        throw new AuthenticationError('Erro no servidor. Tente novamente mais tarde.');
      }
      if (error.response.status === 503) {
        throw new AuthenticationError('Serviço temporariamente indisponível.');
      }

      // Outros erros HTTP
      throw new AuthenticationError(`Erro ao fazer login (${error.response.status}). Tente novamente.`);
    }
  }
}

import { apiClient } from '../../services/api/apiClient';
import { RegisterRequest } from '../../domain/entities/signup/RegisterRequest';
import { RegisterResult } from '../../domain/entities/signup/RegisterResult';
import { AuthenticationError } from '../../domain/errors/CustomErrors';

export class RegisterApi {
  async startRegistration(request: RegisterRequest): Promise<void> {
    try {
      const url = '/auth/register';
      console.log('🔗 RegisterApi.startRegistration - Fazendo requisição para:', url);
      
      await apiClient.post(url, {
        email: request.email,
        name: request.name,
        username: request.username,
        cellphone: request.cellphone,
        gambler: request.gambler,
      });
    } catch (error: any) {
      console.error('🚨 RegisterApi.startRegistration - Erro detalhado:', {
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
      if (error.response.status === 503) {
        throw new AuthenticationError('Serviço temporariamente indisponível.');
      }

      // Outros erros HTTP
      throw new AuthenticationError(`Erro ao iniciar cadastro (${error.response.status}). Tente novamente.`);
    }
  }

  async verifyCode(email: string, code: string): Promise<void> {
    try {
      const url = '/auth/register/verify';
      console.log('🔗 RegisterApi.verifyCode - Fazendo requisição para:', url);
      
      await apiClient.post(url, {
        email,
        code,
      });
    } catch (error: any) {
      console.error('🚨 RegisterApi.verifyCode - Erro detalhado:', {
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

      // Erros de rede
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
      if (error.response.status === 401) {
        throw new AuthenticationError('Código inválido ou expirado');
      }
      if (error.response.status === 400) {
        throw new AuthenticationError('Dados inválidos');
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
      throw new AuthenticationError(`Erro ao verificar código (${error.response.status}). Tente novamente.`);
    }
  }

  async createPassword(email: string, password: string): Promise<RegisterResult> {
    try {
      const url = '/auth/register/password';
      console.log('🔗 RegisterApi.createPassword - Fazendo requisição para:', url);
      
      const response = await apiClient.post(url, {
        email,
        password,
      });

      const userData = response.data;

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        cellphone: userData.cellphone,
        betcoins: userData.betcoins || 0,
        ranking_points: userData.ranking_points || 0,
        gambler: userData.gambler || false,
      };
    } catch (error: any) {
      console.error('🚨 RegisterApi.createPassword - Erro detalhado:', {
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

      // Erros de rede
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
      if (error.response.status === 401) {
        throw new AuthenticationError('Email não verificado');
      }
      if (error.response.status === 400) {
        throw new AuthenticationError('Dados inválidos');
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
      throw new AuthenticationError(`Erro ao criar senha (${error.response.status}). Tente novamente.`);
    }
  }
}

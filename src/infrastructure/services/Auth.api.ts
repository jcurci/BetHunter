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

      const dataUser = response.data.user;
      const user =
        dataUser && typeof dataUser === 'object' && dataUser.id
          ? {
              id: dataUser.id,
              name: dataUser.name ?? '',
              email: dataUser.email ?? '',
              energy: dataUser.energy,
              app_streak: dataUser.app_streak,
            }
          : undefined;

      return {
        accessToken: token,
        user,
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

  async loginWithGoogle(idToken: string): Promise<AuthSession> {
    try {
      const url = '/auth/google';
      console.log('🔗 AuthApi.loginWithGoogle - Fazendo requisição para:', url);

      const response = await apiClient.post(url, { idToken });

      const token = response.data.token || response.data.accessToken;

      if (!token) {
        throw new AuthenticationError('Token não recebido do servidor');
      }

      const dataUser = response.data.user;
      const user =
        dataUser && typeof dataUser === 'object' && dataUser.id
          ? {
              id: dataUser.id,
              name: dataUser.name ?? '',
              email: dataUser.email ?? '',
              energy: dataUser.energy,
              app_streak: dataUser.app_streak,
            }
          : undefined;

      return {
        accessToken: token,
        user,
      };
    } catch (error: any) {
      console.error('🚨 AuthApi.loginWithGoogle - Erro detalhado:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
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
        throw new AuthenticationError('Token Google inválido ou expirado. Tente novamente.');
      }
      if (error.response.status === 500) {
        throw new AuthenticationError('Erro no servidor. Tente novamente mais tarde.');
      }

      throw new AuthenticationError(`Erro ao fazer login com Google (${error.response.status}).`);
    }
  }

  async requestPasswordChange(email: string): Promise<void> {
    try {
      const url = '/auth/password/change/request';
      console.log('🔗 AuthApi.requestPasswordChange - Fazendo requisição para:', url);
      await apiClient.post(url, { email });
    } catch (error: any) {
      console.error('🚨 AuthApi.requestPasswordChange - Erro detalhado:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        isNetworkError: !error.response,
      });
      if (error instanceof AuthenticationError) throw error;
      if (!error.response) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          throw new AuthenticationError('Timeout. O servidor demorou muito para responder.');
        }
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
          throw new AuthenticationError('Erro de conexão. Verifique sua internet.');
        }
        throw new AuthenticationError('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }
      if (error.response.status === 404) {
        throw new AuthenticationError('E-mail não cadastrado.');
      }
      if (error.response.status === 400 || error.response.status === 401) {
        const msg = error.response.data?.message || 'Dados inválidos. Verifique o e-mail.';
        throw new AuthenticationError(Array.isArray(msg) ? msg.join(', ') : msg);
      }
      if (error.response.status === 500 || error.response.status === 503) {
        throw new AuthenticationError('Erro no servidor. Tente novamente mais tarde.');
      }
      throw new AuthenticationError(`Erro ao solicitar redefinição (${error.response.status}). Tente novamente.`);
    }
  }

  async verifyPasswordChangeCode(email: string, code: string): Promise<void> {
    try {
      const url = '/auth/password/change/verify';
      console.log('🔗 AuthApi.verifyPasswordChangeCode - Fazendo requisição para:', url);
      await apiClient.post(url, { email, code });
    } catch (error: any) {
      console.error('🚨 AuthApi.verifyPasswordChangeCode - Erro detalhado:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        isNetworkError: !error.response,
      });
      if (error instanceof AuthenticationError) throw error;
      if (!error.response) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          throw new AuthenticationError('Timeout. O servidor demorou muito para responder.');
        }
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
          throw new AuthenticationError('Erro de conexão. Verifique sua internet.');
        }
        throw new AuthenticationError('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }
      if (error.response.status === 400 || error.response.status === 401) {
        throw new AuthenticationError('Código inválido ou expirado. Solicite um novo código.');
      }
      if (error.response.status === 404) {
        throw new AuthenticationError('Endpoint não encontrado. Verifique a configuração.');
      }
      if (error.response.status === 500 || error.response.status === 503) {
        throw new AuthenticationError('Erro no servidor. Tente novamente mais tarde.');
      }
      throw new AuthenticationError(`Erro ao verificar código (${error.response.status}). Tente novamente.`);
    }
  }

  async confirmPasswordChange(email: string, code: string, newPassword: string): Promise<void> {
    try {
      const url = '/auth/password/change/confirm';
      console.log('🔗 AuthApi.confirmPasswordChange - Fazendo requisição para:', url);
      await apiClient.post(url, { email, code, new_password: newPassword });
    } catch (error: any) {
      console.error('🚨 AuthApi.confirmPasswordChange - Erro detalhado:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        isNetworkError: !error.response,
      });
      if (error instanceof AuthenticationError) throw error;
      if (!error.response) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          throw new AuthenticationError('Timeout. O servidor demorou muito para responder.');
        }
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
          throw new AuthenticationError('Erro de conexão. Verifique sua internet.');
        }
        throw new AuthenticationError('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }
      if (error.response.status === 400 || error.response.status === 401) {
        const msg = error.response.data?.message || 'Código não verificado ou senha inválida.';
        throw new AuthenticationError(Array.isArray(msg) ? msg.join(', ') : msg);
      }
      if (error.response.status === 404) {
        throw new AuthenticationError('Endpoint não encontrado. Verifique a configuração.');
      }
      if (error.response.status === 500 || error.response.status === 503) {
        throw new AuthenticationError('Erro no servidor. Tente novamente mais tarde.');
      }
      throw new AuthenticationError(`Erro ao redefinir senha (${error.response.status}). Tente novamente.`);
    }
  }
}

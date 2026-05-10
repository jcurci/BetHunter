import { apiClient } from '../../services/api/apiClient';
import { CourseMaterial } from '../../domain/entities/CourseMaterial';
import { AuthenticationError, ServerError } from '../../domain/errors/CustomErrors';

export class CourseMaterialApi {
  async findByModuleId(moduleId: string): Promise<CourseMaterial[]> {
    const path = `/module-material/module/${moduleId}`;
    if (__DEV__) {
      console.warn('[BetHunter] CourseMaterialApi → GET', path);
    }
    try {
      const response = await apiClient.get<CourseMaterial[]>(path);
      if (__DEV__) {
        console.warn('[BetHunter] CourseMaterialApi ← OK', { count: response.data?.length });
      }
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      if (__DEV__) {
        console.warn('[BetHunter] CourseMaterialApi ← ERRO', {
          path,
          moduleId,
          httpStatus: error?.response?.status,
          corpoServidor: error?.response?.data,
          axiosMessage: error?.message,
        });
      }
      if (error instanceof AuthenticationError || error instanceof ServerError) {
        throw error;
      }

      if (!error.response) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          throw new AuthenticationError('Timeout. O servidor demorou muito para responder.');
        }
        throw new AuthenticationError('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }

      if (error.response.status === 401) {
        throw new AuthenticationError('Token inválido ou expirado. Faça login novamente.');
      }
      if (error.response.status === 403) {
        const msg = error.response?.data?.message ?? 'Você precisa completar os módulos anteriores primeiro.';
        throw new ServerError(typeof msg === 'string' ? msg : 'Módulo bloqueado.');
      }
      if (error.response.status === 404) {
        return [];
      }

      throw new ServerError('Erro ao carregar o material. Tente novamente.');
    }
  }
}

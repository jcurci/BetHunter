import { apiClient } from '../../services/api/apiClient';
import {
  CourseProgress,
  CourseProgressApiResponse,
  mapCourseProgressFromApi,
} from '../../domain/entities/CourseProgress';
import { AuthenticationError, ServerError } from '../../domain/errors/CustomErrors';

function nestErrorMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const msg = (data as { message?: unknown }).message;
  if (typeof msg === 'string' && msg.trim()) return msg.trim();
  if (Array.isArray(msg) && msg.every((ln) => typeof ln === 'string')) {
    return msg.join(', ').trim();
  }
  return '';
}

export class CourseApi {
  async findAllWithProgress(): Promise<CourseProgress[]> {
    try {
      const url = '/courses';
      console.log('🔗 CourseApi.findAllWithProgress - Fazendo requisição GET para:', url);

      const response = await apiClient.get<CourseProgressApiResponse[]>(url);

      const list = Array.isArray(response.data) ? response.data : [];
      return list.map(mapCourseProgressFromApi);
    } catch (error: any) {
      console.error('🚨 CourseApi.findAllWithProgress - Erro detalhado:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
        isNetworkError: !error.response,
      });

      if (error instanceof AuthenticationError || error instanceof ServerError) {
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
        throw new AuthenticationError('Token inválido ou expirado. Faça login novamente.');
      }
      if (error.response.status === 404) {
        throw new AuthenticationError('Endpoint não encontrado. Verifique a configuração.');
      }
      if (error.response.status === 500) {
        const detail = nestErrorMessage(error.response?.data);
        throw new ServerError(
          detail
            ? `O servidor retornou um erro ao carregar os cursos: ${detail}`
            : 'O servidor não conseguiu processar os cursos. Tente novamente mais tarde.',
        );
      }

      throw new AuthenticationError(`Erro ao buscar cursos (${error.response.status}). Tente novamente.`);
    }
  }
}

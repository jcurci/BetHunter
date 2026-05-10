import { apiClient } from '../../services/api/apiClient';
import {
  CourseModule,
  CourseModuleApiResponse,
  mapCourseModuleFromApi,
} from '../../domain/entities/CourseModule';
import { AuthenticationError, ServerError } from '../../domain/errors/CustomErrors';

export class CourseModuleApi {
  async findByCourseId(courseId: string): Promise<CourseModule[]> {
    try {
      const response = await apiClient.get<CourseModuleApiResponse[]>(
        `/modules/course/${courseId}`,
      );
      const list = Array.isArray(response.data) ? response.data : [];
      return list.map(mapCourseModuleFromApi);
    } catch (error: any) {
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
      if (error.response.status === 404) {
        throw new ServerError('Módulos não encontrados para este curso.');
      }

      throw new ServerError('Erro ao carregar módulos. Tente novamente.');
    }
  }
}

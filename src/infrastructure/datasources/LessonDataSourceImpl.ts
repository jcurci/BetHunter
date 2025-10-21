import { Lesson } from '../../domain/entities/Lesson';
import { LessonDataSource } from '../../data/datasources/LessonDataSource';
import { apiClient } from '../../services/api/apiClient';

export class LessonDataSourceImpl implements LessonDataSource {
  async getUserLessons(): Promise<Lesson[]> {
    try {
      console.log('📚 Buscando lições do usuário...');
      
      // Token é adicionado automaticamente pelo interceptor do apiClient
      const response = await apiClient.get('/lessons/user_lessons');
      
      console.log('✅ Lições recebidas:', response.data);
      
      // Mapear resposta do backend para entidade Lesson
      const lessons: Lesson[] = response.data.map((dto: any) => ({
        id: dto.id,
        title: dto.title,
        totalTopics: dto.totalTopics,
        completedTopics: dto.completedTopics,
        progressPercent: dto.progressPercent,
      }));
      
      return lessons;
    } catch (error) {
      console.error('❌ Erro ao buscar lições:', error);
      throw error;
    }
  }
}



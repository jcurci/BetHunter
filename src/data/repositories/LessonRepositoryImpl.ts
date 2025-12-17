import { Lesson } from '../../domain/entities/Lesson';
import { LessonRepository } from '../../domain/repositories/LessonRepository';
import { LessonDataSource } from '../datasources/LessonDataSource';

export class LessonRepositoryImpl implements LessonRepository {
  constructor(private lessonDataSource: LessonDataSource) {}

  async getUserLessons(): Promise<Lesson[]> {
    return await this.lessonDataSource.getUserLessons();
  }
}
















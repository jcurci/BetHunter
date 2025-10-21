import { Lesson } from '../entities/Lesson';
import { LessonRepository } from '../repositories/LessonRepository';

export class LessonUseCase {
  constructor(private lessonRepository: LessonRepository) {}

  async getUserLessons(): Promise<Lesson[]> {
    return await this.lessonRepository.getUserLessons();
  }
}



import { Lesson } from '../../domain/entities/Lesson';

export interface LessonDataSource {
  getUserLessons(): Promise<Lesson[]>;
}














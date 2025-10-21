import { Lesson } from '../entities/Lesson';

export interface LessonRepository {
  getUserLessons(): Promise<Lesson[]>;
}



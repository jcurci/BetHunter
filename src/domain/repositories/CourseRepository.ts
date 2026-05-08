import { CourseProgress } from '../entities/CourseProgress';

export interface CourseRepository {
  findAllWithProgress(): Promise<CourseProgress[]>;
}

import { CourseRepository } from '../repositories/CourseRepository';
import { CourseProgress } from '../entities/CourseProgress';

export class GetCoursesWithProgressUseCase {
  constructor(private courseRepository: CourseRepository) {}

  async execute(): Promise<CourseProgress[]> {
    return this.courseRepository.findAllWithProgress();
  }
}

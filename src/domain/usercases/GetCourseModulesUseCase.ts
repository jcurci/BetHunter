import { CourseModule } from '../entities/CourseModule';
import { CourseModuleRepository } from '../repositories/CourseModuleRepository';

export class GetCourseModulesUseCase {
  constructor(private courseModuleRepository: CourseModuleRepository) {}

  async execute(courseId: string): Promise<CourseModule[]> {
    return this.courseModuleRepository.findByCourseId(courseId);
  }
}

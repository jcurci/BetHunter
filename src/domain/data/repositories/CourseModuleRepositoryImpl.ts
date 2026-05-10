import { CourseModuleRepository } from '../../repositories/CourseModuleRepository';
import { CourseModuleApi } from '../../../infrastructure/services/CourseModule.api';
import { CourseModule } from '../../entities/CourseModule';

export class CourseModuleRepositoryImpl implements CourseModuleRepository {
  constructor(private courseModuleApi: CourseModuleApi) {}

  async findByCourseId(courseId: string): Promise<CourseModule[]> {
    return this.courseModuleApi.findByCourseId(courseId);
  }
}

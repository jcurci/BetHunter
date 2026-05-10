import { CourseModule } from '../entities/CourseModule';

export interface CourseModuleRepository {
  findByCourseId(courseId: string): Promise<CourseModule[]>;
}

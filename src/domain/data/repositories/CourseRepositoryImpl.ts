import { CourseRepository } from '../../repositories/CourseRepository';
import { CourseApi } from '../../../infrastructure/services/Course.api';
import { CourseProgress } from '../../entities/CourseProgress';

export class CourseRepositoryImpl implements CourseRepository {
  constructor(private courseApi: CourseApi) {}

  async findAllWithProgress(): Promise<CourseProgress[]> {
    return this.courseApi.findAllWithProgress();
  }
}

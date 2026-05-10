import { CourseMaterial } from '../entities/CourseMaterial';
import { CourseMaterialRepository } from '../repositories/CourseMaterialRepository';

export class GetCourseMaterialUseCase {
  constructor(private readonly repo: CourseMaterialRepository) {}

  async execute(moduleId: string): Promise<CourseMaterial[]> {
    return this.repo.findByModuleId(moduleId);
  }
}

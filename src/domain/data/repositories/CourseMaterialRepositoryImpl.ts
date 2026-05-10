import { CourseMaterial } from '../../entities/CourseMaterial';
import { CourseMaterialRepository } from '../../repositories/CourseMaterialRepository';
import { CourseMaterialApi } from '../../../infrastructure/services/CourseMaterial.api';

export class CourseMaterialRepositoryImpl implements CourseMaterialRepository {
  constructor(private readonly api: CourseMaterialApi) {}

  findByModuleId(moduleId: string): Promise<CourseMaterial[]> {
    return this.api.findByModuleId(moduleId);
  }
}

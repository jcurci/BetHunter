import { CourseMaterial } from '../entities/CourseMaterial';

export interface CourseMaterialRepository {
  findByModuleId(moduleId: string): Promise<CourseMaterial[]>;
}

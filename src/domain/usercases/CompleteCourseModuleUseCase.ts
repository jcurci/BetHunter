import { ModuleCourseProgressRepository } from '../repositories/ModuleCourseProgressRepository';
import { CompleteModuleResult } from '../entities/ModuleSubmission';

export class CompleteCourseModuleUseCase {
  constructor(private readonly repository: ModuleCourseProgressRepository) {}

  async execute(moduleId: string): Promise<CompleteModuleResult> {
    if (!moduleId?.trim()) {
      throw new Error('Módulo inválido');
    }
    return this.repository.completeNonQuizModule(moduleId);
  }
}

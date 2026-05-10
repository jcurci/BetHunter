import { ModuleCourseProgressRepository } from '../repositories/ModuleCourseProgressRepository';
import {
  SubmitQuizAnswerPayload,
  SubmitQuizModuleResult,
} from '../entities/ModuleSubmission';

export class SubmitQuizModuleUseCase {
  constructor(private readonly repository: ModuleCourseProgressRepository) {}

  async execute(
    moduleId: string,
    answers: SubmitQuizAnswerPayload[],
  ): Promise<SubmitQuizModuleResult> {
    if (!moduleId?.trim()) {
      throw new Error('Módulo inválido');
    }
    if (!answers?.length) {
      throw new Error('Respostas incompletas');
    }
    return this.repository.submitQuizModule(moduleId, answers);
  }
}

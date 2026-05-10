import { ModuleCourseProgressRepository } from '../../repositories/ModuleCourseProgressRepository';
import {
  CompleteModuleResult,
  SubmitQuizAnswerPayload,
  SubmitQuizModuleResult,
} from '../../entities/ModuleSubmission';
import { ModuleCourseProgressApi } from '../../../infrastructure/services/ModuleCourseProgress.api';

export class ModuleCourseProgressRepositoryImpl implements ModuleCourseProgressRepository {
  constructor(private readonly api: ModuleCourseProgressApi) {}

  submitQuizModule(
    moduleId: string,
    answers: SubmitQuizAnswerPayload[],
  ): Promise<SubmitQuizModuleResult> {
    return this.api.submitQuizModule(moduleId, answers);
  }

  completeNonQuizModule(moduleId: string): Promise<CompleteModuleResult> {
    return this.api.completeNonQuizModule(moduleId);
  }
}

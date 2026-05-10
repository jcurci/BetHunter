import {
  CompleteModuleResult,
  SubmitQuizAnswerPayload,
  SubmitQuizModuleResult,
} from '../entities/ModuleSubmission';

export interface ModuleCourseProgressRepository {
  submitQuizModule(
    moduleId: string,
    answers: SubmitQuizAnswerPayload[],
  ): Promise<SubmitQuizModuleResult>;
  completeNonQuizModule(moduleId: string): Promise<CompleteModuleResult>;
}

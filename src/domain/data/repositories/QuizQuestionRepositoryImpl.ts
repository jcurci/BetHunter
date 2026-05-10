import { QuizQuestion } from '../../entities/QuizQuestion';
import { QuizQuestionRepository } from '../../repositories/QuizQuestionRepository';
import { QuizQuestionApi } from '../../../infrastructure/services/QuizQuestion.api';

export class QuizQuestionRepositoryImpl implements QuizQuestionRepository {
  constructor(private readonly api: QuizQuestionApi) {}

  findUnansweredByModuleId(moduleId: string): Promise<QuizQuestion[]> {
    return this.api.findUnansweredByModuleId(moduleId);
  }
}

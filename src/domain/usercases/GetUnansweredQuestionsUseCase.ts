import { QuizQuestion } from '../entities/QuizQuestion';
import { QuizQuestionRepository } from '../repositories/QuizQuestionRepository';

export class GetUnansweredQuestionsUseCase {
  constructor(private readonly repo: QuizQuestionRepository) {}

  async execute(moduleId: string): Promise<QuizQuestion[]> {
    return this.repo.findUnansweredByModuleId(moduleId);
  }
}

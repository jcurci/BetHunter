import { QuizQuestion } from '../entities/QuizQuestion';

export interface QuizQuestionRepository {
  findUnansweredByModuleId(moduleId: string): Promise<QuizQuestion[]>;
}

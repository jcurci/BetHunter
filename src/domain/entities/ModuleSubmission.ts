/** Response from POST /modules/:moduleId/submit */
export interface SubmitQuizModuleResult {
  stars: number;
  accuracy: number;
  correctCount: number;
  totalQuestions: number;
}

/** Response from POST /modules/:moduleId/complete */
export interface CompleteModuleResult {
  completed: boolean;
  starsEarned: number;
}

export interface SubmitQuizAnswerPayload {
  questionId: string;
  alternativeId: string;
}

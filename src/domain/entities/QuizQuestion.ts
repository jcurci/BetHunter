export interface QuizAlternative {
  id: string;
  text: string;
  correct: boolean;
}

export interface QuizQuestion {
  id: string;
  questionNumber: number;
  statement: string;
  hint?: string;
  alternatives: QuizAlternative[];
}

import { create } from 'zustand';
import { QuizQuestion } from '../domain/entities/QuizQuestion';

interface QuizStore {
  moduleId: string | null;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  isLoaded: boolean;

  initQuiz: (moduleId: string, questions: QuizQuestion[]) => void;
  saveAnswer: (questionId: string, alternativeId: string) => void;
  setCurrentIndex: (index: number) => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizStore>((set) => ({
  moduleId: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  isLoaded: false,

  initQuiz: (moduleId, questions) =>
    set({ moduleId, questions, isLoaded: true, currentQuestionIndex: 0, answers: {} }),

  saveAnswer: (questionId, alternativeId) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: alternativeId } })),

  setCurrentIndex: (index) => set({ currentQuestionIndex: index }),

  resetQuiz: () =>
    set({ moduleId: null, questions: [], currentQuestionIndex: 0, answers: {}, isLoaded: false }),
}));

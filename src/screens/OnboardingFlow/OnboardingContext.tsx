import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileResult } from './calculateProfile';
import { ONBOARDING_DRAFT_KEY } from './onboardingStorage';

export type QuizAnswers = {
  frequency: string | null;
  financialImpact: string | null;
  motivation: string | null;
  financialSituation: string | null;
  objective: string | null;
  preferredTime: string | null;
  dailyDuration: string | null;
};

export type OnboardingState = {
  pushEnabled: boolean | null;
  answers: QuizAnswers;
  profile: ProfileResult | null;
  currentStep: string | null;
  sobrietyStartDate: string | null;
  betcoinsEarned: number;
  xpEarned: number;
  streak: number;
  firstLessonCompleted: boolean;
  firstLessonQuestionIndex: number;
};

const INITIAL_ANSWERS: QuizAnswers = {
  frequency: null,
  financialImpact: null,
  motivation: null,
  financialSituation: null,
  objective: null,
  preferredTime: null,
  dailyDuration: null,
};

type OnboardingContextValue = {
  pushEnabled: boolean | null;
  setPushEnabled: (value: boolean | null) => void;
  answers: QuizAnswers;
  setAnswer: (key: keyof QuizAnswers, value: string) => void;
  profile: ProfileResult | null;
  setProfile: (result: ProfileResult) => void;
  persistStep: (stepId: string) => void;
  hydrated: boolean;
  savedStep: string | null;
  sobrietyStartDate: string | null;
  setSobrietyStartDate: (iso: string) => void;
  betcoinsEarned: number;
  addBetcoins: (amount: number) => void;
  xpEarned: number;
  addXp: (amount: number) => void;
  streak: number;
  setStreak: (value: number) => void;
  firstLessonCompleted: boolean;
  setFirstLessonCompleted: (value: boolean) => void;
  firstLessonQuestionIndex: number;
  setFirstLessonQuestionIndex: (index: number) => void;
  completeFirstLesson: (betcoins: number, xp: number) => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

type OnboardingProviderProps = { children: ReactNode };

async function persistState(state: OnboardingState) {
  try {
    await AsyncStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(state));
  } catch { /* silent */ }
}

async function loadState(): Promise<OnboardingState | null> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (raw) return JSON.parse(raw) as OnboardingState;
  } catch { /* silent */ }
  return null;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [pushEnabled, setPushEnabledRaw] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<QuizAnswers>(INITIAL_ANSWERS);
  const [profile, setProfileRaw] = useState<ProfileResult | null>(null);
  const [savedStep, setSavedStep] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sobrietyStartDate, setSobrietyRaw] = useState<string | null>(null);
  const [betcoinsEarned, setBetcoins] = useState(0);
  const [xpEarned, setXp] = useState(0);
  const [streak, setStreakRaw] = useState(0);
  const [firstLessonCompleted, setFirstLessonRaw] = useState(false);
  const [firstLessonQuestionIndex, setFirstLessonQuestionIndexRaw] = useState(0);

  useEffect(() => {
    loadState().then((saved) => {
      if (saved) {
        setPushEnabledRaw(saved.pushEnabled);
        setAnswers(saved.answers);
        setProfileRaw(saved.profile);
        setSavedStep(saved.currentStep);
        setSobrietyRaw(saved.sobrietyStartDate ?? null);
        setBetcoins(saved.betcoinsEarned ?? 0);
        setXp(saved.xpEarned ?? 0);
        setStreakRaw(saved.streak ?? 0);
        setFirstLessonRaw(saved.firstLessonCompleted ?? false);
        setFirstLessonQuestionIndexRaw(saved.firstLessonQuestionIndex ?? 0);
      }
      setHydrated(true);
    });
  }, []);

  const buildState = useCallback(
    (overrides?: Partial<OnboardingState>): OnboardingState => ({
      pushEnabled,
      answers,
      profile,
      currentStep: savedStep,
      sobrietyStartDate,
      betcoinsEarned,
      xpEarned,
      streak,
      firstLessonCompleted,
      firstLessonQuestionIndex,
      ...overrides,
    }),
    [pushEnabled, answers, profile, savedStep, sobrietyStartDate, betcoinsEarned, xpEarned, streak, firstLessonCompleted, firstLessonQuestionIndex],
  );

  const setPushEnabled = useCallback((value: boolean | null) => {
    setPushEnabledRaw(value);
    persistState(buildState({ pushEnabled: value }));
  }, [buildState]);

  const setAnswer = useCallback((key: keyof QuizAnswers, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value };
      persistState(buildState({ answers: next }));
      return next;
    });
  }, [buildState]);

  const setProfile = useCallback((result: ProfileResult) => {
    setProfileRaw(result);
    persistState(buildState({ profile: result }));
  }, [buildState]);

  const persistStep = useCallback((stepId: string) => {
    setSavedStep(stepId);
    persistState(buildState({ currentStep: stepId }));
  }, [buildState]);

  const setSobrietyStartDate = useCallback((iso: string) => {
    setSobrietyRaw(iso);
    persistState(buildState({ sobrietyStartDate: iso }));
  }, [buildState]);

  const addBetcoins = useCallback((amount: number) => {
    setBetcoins((prev) => {
      const next = prev + amount;
      persistState(buildState({ betcoinsEarned: next }));
      return next;
    });
  }, [buildState]);

  const addXp = useCallback((amount: number) => {
    setXp((prev) => {
      const next = prev + amount;
      persistState(buildState({ xpEarned: next }));
      return next;
    });
  }, [buildState]);

  const setStreak = useCallback((value: number) => {
    setStreakRaw(value);
    persistState(buildState({ streak: value }));
  }, [buildState]);

  const setFirstLessonCompleted = useCallback((value: boolean) => {
    setFirstLessonRaw(value);
    persistState(buildState({ firstLessonCompleted: value }));
  }, [buildState]);

  const setFirstLessonQuestionIndex = useCallback((index: number) => {
    setFirstLessonQuestionIndexRaw(index);
    persistState(buildState({ firstLessonQuestionIndex: index }));
  }, [buildState]);

  const completeFirstLesson = useCallback((betcoins: number, xp: number) => {
    const newBetcoins = betcoinsEarned + betcoins;
    const newXp = xpEarned + xp;
    setBetcoins(newBetcoins);
    setXp(newXp);
    setStreakRaw(1);
    setFirstLessonRaw(true);
    setSavedStep('celebration');
    setFirstLessonQuestionIndexRaw(0);
    persistState({
      ...buildState(),
      betcoinsEarned: newBetcoins,
      xpEarned: newXp,
      streak: 1,
      firstLessonCompleted: true,
      firstLessonQuestionIndex: 0,
      currentStep: 'celebration',
    });
  }, [betcoinsEarned, xpEarned, buildState]);

  return (
    <OnboardingContext.Provider
      value={{
        pushEnabled, setPushEnabled,
        answers, setAnswer,
        profile, setProfile,
        persistStep, hydrated, savedStep,
        sobrietyStartDate, setSobrietyStartDate,
        betcoinsEarned, addBetcoins,
        xpEarned, addXp,
        streak, setStreak,
        firstLessonCompleted, setFirstLessonCompleted,
        firstLessonQuestionIndex, setFirstLessonQuestionIndex,
        completeFirstLesson,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}

import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import { setOnboardingFlowCompleted } from './onboardingStorage';
import { NotificationsPermissionScreen } from './screens/NotificationsPermissionScreen';
import { QuizFrequencyScreen } from './screens/QuizFrequencyScreen';
import { QuizFinancialImpactScreen } from './screens/QuizFinancialImpactScreen';
import { QuizMotivationScreen } from './screens/QuizMotivationScreen';
import { QuizFinancialSituationScreen } from './screens/QuizFinancialSituationScreen';
import { QuizObjectiveScreen } from './screens/QuizObjectiveScreen';
import { QuizLearningPreferencesScreen } from './screens/QuizLearningPreferencesScreen';
import { DiagnosticScreen } from './screens/DiagnosticScreen';
import { FinancialProjectionScreen } from './screens/FinancialProjectionScreen';
import { PlanPreviewScreen } from './screens/PlanPreviewScreen';
import { CounterActivationScreen } from './screens/CounterActivationScreen';
import { FirstLessonScreen } from './screens/FirstLessonScreen';
import { CelebrationScreen } from './screens/CelebrationScreen';

type StepId =
  | 'notifications'
  | 'quizFrequency'
  | 'quizFinancialImpact'
  | 'quizMotivation'
  | 'quizFinancialSituation'
  | 'quizObjective'
  | 'quizLearningPrefs'
  | 'diagnostic'
  | 'financialProjection'
  | 'planPreview'
  | 'counterActivation'
  | 'firstLesson'
  | 'celebration';

const STEP_ORDER: StepId[] = [
  'notifications',
  'quizFrequency',
  'quizFinancialImpact',
  'quizMotivation',
  'quizFinancialSituation',
  'quizObjective',
  'quizLearningPrefs',
  'diagnostic',
  'financialProjection',
  'planPreview',
  'counterActivation',
  'firstLesson',
  'celebration',
];

const TOTAL_STEPS = STEP_ORDER.length;
const QUIZ_TOTAL = 6;

const OnboardingInner: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { hydrated, savedStep, persistStep } = useOnboarding();
  const [step, setStep] = useState<StepId>('notifications');

  useEffect(() => {
    if (hydrated && savedStep && STEP_ORDER.includes(savedStep as StepId)) {
      setStep(savedStep as StepId);
    }
  }, [hydrated, savedStep]);

  const currentIndex = STEP_ORDER.indexOf(step);

  const goTo = (next: StepId) => {
    setStep(next);
    persistStep(next);
  };
  const goBack = () => {
    if (currentIndex > 0) {
      const prev = STEP_ORDER[currentIndex - 1];
      setStep(prev);
      persistStep(prev);
    }
  };
  const goNext = () => {
    if (currentIndex < STEP_ORDER.length - 1) {
      const next = STEP_ORDER[currentIndex + 1];
      setStep(next);
      persistStep(next);
    }
  };

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#D783D8" />
      </View>
    );
  }

  const shared = { currentStep: currentIndex, totalSteps: TOTAL_STEPS };

  switch (step) {
    case 'notifications':
      return (
        <NotificationsPermissionScreen
          {...shared}
          onNext={() => goTo('quizFrequency')}
        />
      );
    case 'quizFrequency':
      return (
        <QuizFrequencyScreen
          {...shared}
          quizStep={1}
          quizTotal={QUIZ_TOTAL}
          onNext={goNext}
          onBack={goBack}
        />
      );
    case 'quizFinancialImpact':
      return (
        <QuizFinancialImpactScreen
          {...shared}
          quizStep={2}
          quizTotal={QUIZ_TOTAL}
          onNext={goNext}
          onBack={goBack}
        />
      );
    case 'quizMotivation':
      return (
        <QuizMotivationScreen
          {...shared}
          quizStep={3}
          quizTotal={QUIZ_TOTAL}
          onNext={goNext}
          onBack={goBack}
        />
      );
    case 'quizFinancialSituation':
      return (
        <QuizFinancialSituationScreen
          {...shared}
          quizStep={4}
          quizTotal={QUIZ_TOTAL}
          onNext={goNext}
          onBack={goBack}
        />
      );
    case 'quizObjective':
      return (
        <QuizObjectiveScreen
          {...shared}
          quizStep={5}
          quizTotal={QUIZ_TOTAL}
          onNext={goNext}
          onBack={goBack}
        />
      );
    case 'quizLearningPrefs':
      return (
        <QuizLearningPreferencesScreen
          {...shared}
          quizStep={6}
          quizTotal={QUIZ_TOTAL}
          onNext={goNext}
          onBack={goBack}
        />
      );
    case 'diagnostic':
      return (
        <DiagnosticScreen
          {...shared}
          onNext={goNext}
          onBack={goBack}
        />
      );
    case 'financialProjection':
      return (
        <FinancialProjectionScreen
          {...shared}
          onNext={goNext}
          onBack={goBack}
        />
      );
    case 'planPreview':
      return (
        <PlanPreviewScreen
          {...shared}
          onNext={goNext}
          onBack={goBack}
        />
      );
    case 'counterActivation':
      return (
        <CounterActivationScreen
          {...shared}
          onNext={goNext}
          onBack={goBack}
        />
      );
    case 'firstLesson':
      return (
        <FirstLessonScreen
          {...shared}
          onNext={goNext}
          onBack={goBack}
        />
      );
    case 'celebration':
      return (
        <CelebrationScreen
          {...shared}
          onNext={goNext}
          onBack={goBack}
        />
      );
    default:
      return null;
  }
};

const OnboardingFlow: React.FC = () => (
  <OnboardingProvider>
    <OnboardingInner />
  </OnboardingProvider>
);

export default OnboardingFlow;

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

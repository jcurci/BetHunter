import React, { useState, useEffect } from 'react';
import { AppLoadingScreen } from '../../components/AppLoadingScreen';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp as RNRouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';
import { OnboardingProvider, useOnboarding } from './OnboardingContext';
import { setOnboardingFlowCompleted } from './onboardingStorage';
import { NotificationsPermissionScreen } from './screens/NotificationsPermissionScreen';
import { QuizAcquisitionSourceScreen } from './screens/QuizAcquisitionSourceScreen';
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
  | 'quizAcquisitionSource'
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
  'quizAcquisitionSource',
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

/**
 * Telas que exibem o badge "N de M" do quiz, na ordem. Derivar daqui em vez de
 * espalhar literais evita renumerar tudo a cada passo inserido.
 */
const QUIZ_STEPS: StepId[] = [
  'quizAcquisitionSource',
  'quizFrequency',
  'quizFinancialImpact',
  'quizMotivation',
  'quizFinancialSituation',
  'quizObjective',
  'quizLearningPrefs',
];
const QUIZ_TOTAL = QUIZ_STEPS.length;
const quizStepOf = (id: StepId) => QUIZ_STEPS.indexOf(id) + 1;

const OnboardingInner: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RNRouteProp<RootStackParamList, 'OnboardingFlow'>>();
  const startAtStep = route.params?.startAtStep;
  const { hydrated, savedStep, persistStep, completeFirstLesson } = useOnboarding();
  const [step, setStep] = useState<StepId>('notifications');

  useEffect(() => {
    const target = startAtStep ?? savedStep;
    if (hydrated && target && STEP_ORDER.includes(target as StepId)) {
      setStep(target as StepId);
    }
  }, [hydrated, savedStep, startAtStep]);

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
    return <AppLoadingScreen />;
  }

  const shared = { currentStep: currentIndex, totalSteps: TOTAL_STEPS };
  const quizProps = {
    ...shared,
    quizStep: quizStepOf(step),
    quizTotal: QUIZ_TOTAL,
    onNext: goNext,
    onBack: goBack,
  };

  switch (step) {
    case 'notifications':
      return (
        <NotificationsPermissionScreen
          {...shared}
          onNext={() => goTo('quizAcquisitionSource')}
        />
      );
    case 'quizAcquisitionSource':
      return <QuizAcquisitionSourceScreen {...quizProps} />;
    case 'quizFrequency':
      return <QuizFrequencyScreen {...quizProps} />;
    case 'quizFinancialImpact':
      return <QuizFinancialImpactScreen {...quizProps} />;
    case 'quizMotivation':
      return <QuizMotivationScreen {...quizProps} />;
    case 'quizFinancialSituation':
      return <QuizFinancialSituationScreen {...quizProps} />;
    case 'quizObjective':
      return <QuizObjectiveScreen {...quizProps} />;
    case 'quizLearningPrefs':
      return <QuizLearningPreferencesScreen {...quizProps} />;
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
          onFinishLesson={(betcoins, xp) => {
            completeFirstLesson(betcoins, xp);
            setStep('celebration');
          }}
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

import React, { useState } from 'react';
import { View } from 'react-native';
import { useOnboarding } from '../OnboardingContext';
import { quizStyles } from './quizStyles';
import { OnboardingLayout } from './OnboardingLayout';
import { AnimatedQuizCard } from './AnimatedQuizCard';
import { QuizContinueButton } from './QuizContinueButton';

const OPTIONS = [
  'Nunca apostei',
  '1–3x por semana',
  'Todo dia',
  'Já parei, mas recaí',
];

type Props = {
  currentStep: number;
  totalSteps: number;
  quizStep: number;
  quizTotal: number;
  onNext: () => void;
  onBack: () => void;
};

export const QuizFrequencyScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  quizStep,
  quizTotal,
  onNext,
  onBack,
}) => {
  const { answers, setAnswer } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(answers.frequency);

  const handleContinue = () => {
    if (selected) {
      setAnswer('frequency', selected);
      onNext();
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      stepLabel={`${quizStep} de ${quizTotal} — Frequência`}
    >
      <View style={quizStyles.centerContent}>
        <AnimatedQuizCard
          question="Com que frequência você aposta atualmente?"
          options={OPTIONS}
          selected={selected}
          onSelect={setSelected}
        />
      </View>

      <View style={quizStyles.bottomBar}>
        <QuizContinueButton enabled={!!selected} onPress={handleContinue} />
      </View>
    </OnboardingLayout>
  );
};

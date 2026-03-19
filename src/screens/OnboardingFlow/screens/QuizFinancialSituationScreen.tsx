import React, { useState } from 'react';
import { View } from 'react-native';
import { useOnboarding } from '../OnboardingContext';
import { quizStyles } from './quizStyles';
import { OnboardingLayout } from './OnboardingLayout';
import { AnimatedQuizCard } from './AnimatedQuizCard';
import { QuizContinueButton } from './QuizContinueButton';

const OPTIONS = [
  'Estável, consigo poupar',
  'No limite — gasto tudo que ganho',
  'Com dívidas, mas controlando',
  'Endividado e sem controle',
];

type Props = {
  currentStep: number;
  totalSteps: number;
  quizStep: number;
  quizTotal: number;
  onNext: () => void;
  onBack: () => void;
};

export const QuizFinancialSituationScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  quizStep,
  quizTotal,
  onNext,
  onBack,
}) => {
  const { answers, setAnswer } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(answers.financialSituation);

  const handleContinue = () => {
    if (selected) {
      setAnswer('financialSituation', selected);
      onNext();
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      stepLabel={`${quizStep} de ${quizTotal} — Situação financeira`}
    >
      <View style={quizStyles.centerContent}>
        <AnimatedQuizCard
          question="Como você descreveria sua situação financeira hoje?"
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

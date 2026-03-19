import React, { useState } from 'react';
import { View } from 'react-native';
import { useOnboarding } from '../OnboardingContext';
import { quizStyles } from './quizStyles';
import { OnboardingLayout } from './OnboardingLayout';
import { AnimatedQuizCard } from './AnimatedQuizCard';
import { QuizContinueButton } from './QuizContinueButton';

const OPTIONS = [
  'Menos de R$ 100',
  'R$ 100 – R$ 500',
  'R$ 500 – R$ 2.000',
  'Mais de R$ 2.000',
];

type Props = {
  currentStep: number;
  totalSteps: number;
  quizStep: number;
  quizTotal: number;
  onNext: () => void;
  onBack: () => void;
};

export const QuizFinancialImpactScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  quizStep,
  quizTotal,
  onNext,
  onBack,
}) => {
  const { answers, setAnswer } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(answers.financialImpact);

  const handleContinue = () => {
    if (selected) {
      setAnswer('financialImpact', selected);
      onNext();
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      stepLabel={`${quizStep} de ${quizTotal} — Impacto financeiro`}
    >
      <View style={quizStyles.centerContent}>
        <AnimatedQuizCard
          question="Quanto você estima ter gasto com apostas nos últimos 3 meses?"
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

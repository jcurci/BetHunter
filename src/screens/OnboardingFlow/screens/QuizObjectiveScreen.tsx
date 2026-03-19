import React, { useState } from 'react';
import { View } from 'react-native';
import { useOnboarding } from '../OnboardingContext';
import { quizStyles } from './quizStyles';
import { OnboardingLayout } from './OnboardingLayout';
import { AnimatedQuizCard } from './AnimatedQuizCard';
import { QuizContinueButton } from './QuizContinueButton';

const OPTIONS = [
  'Parar de apostar de vez',
  'Entender melhor meu dinheiro',
  'Sair das dívidas',
  'Ter reserva de emergência',
];

type Props = {
  currentStep: number;
  totalSteps: number;
  quizStep: number;
  quizTotal: number;
  onNext: () => void;
  onBack: () => void;
};

export const QuizObjectiveScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  quizStep,
  quizTotal,
  onNext,
  onBack,
}) => {
  const { answers, setAnswer } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(answers.objective);

  const handleContinue = () => {
    if (selected) {
      setAnswer('objective', selected);
      onNext();
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      stepLabel={`${quizStep} de ${quizTotal} — Objetivo`}
    >
      <View style={quizStyles.centerContent}>
        <AnimatedQuizCard
          question="O que você mais quer conquistar com o Bethunter?"
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

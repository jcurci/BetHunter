import React, { useState } from 'react';
import { View } from 'react-native';
import { useOnboarding } from '../OnboardingContext';
import { quizStyles } from './quizStyles';
import { OnboardingLayout } from './OnboardingLayout';
import { AnimatedQuizCard } from './AnimatedQuizCard';
import { QuizContinueButton } from './QuizContinueButton';

const OPTIONS = [
  'Acreditei que podia ganhar dinheiro',
  'Diversão / entretenimento',
  'Fugir de problemas',
  'Influência de amigos',
];

type Props = {
  currentStep: number;
  totalSteps: number;
  quizStep: number;
  quizTotal: number;
  onNext: () => void;
  onBack: () => void;
};

export const QuizMotivationScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  quizStep,
  quizTotal,
  onNext,
  onBack,
}) => {
  const { answers, setAnswer } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(answers.motivation);

  const handleContinue = () => {
    if (selected) {
      setAnswer('motivation', selected);
      onNext();
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      stepLabel={`${quizStep} de ${quizTotal} — Motivação`}
    >
      <View style={quizStyles.centerContent}>
        <AnimatedQuizCard
          question="Por que você apostou (ou aposta)? Escolha o principal motivo."
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

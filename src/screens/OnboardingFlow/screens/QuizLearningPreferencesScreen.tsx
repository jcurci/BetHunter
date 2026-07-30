import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useOnboarding } from '../OnboardingContext';
import { quizStyles } from './quizStyles';
import { OnboardingLayout } from './OnboardingLayout';
import { OnboardingChip } from './OnboardingChip';
import { QuizContinueButton } from './QuizContinueButton';

const TIME_OPTIONS = ['Manhã', 'Noite', 'Almoço'];
const DURATION_OPTIONS = ['5 min', '10 min', '20 min'];

type Props = {
  currentStep: number;
  totalSteps: number;
  quizStep: number;
  quizTotal: number;
  onNext: () => void;
  onBack: () => void;
};

export const QuizLearningPreferencesScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  quizStep,
  quizTotal,
  onNext,
  onBack,
}) => {
  const { answers, setAnswer } = useOnboarding();
  const [selectedTime, setSelectedTime] = useState<string | null>(answers.preferredTime);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(answers.dailyDuration);

  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const canContinue = selectedTime && selectedDuration;

  const handleContinue = () => {
    if (selectedTime && selectedDuration) {
      setAnswer('preferredTime', selectedTime);
      setAnswer('dailyDuration', selectedDuration);
      onNext();
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      stepLabel={`${quizStep} de ${quizTotal} — Aprendizado`}
    >
      <View style={quizStyles.centerContent}>
        <Animated.View
          style={[
            quizStyles.card,
            { opacity: cardFade, transform: [{ translateY: cardSlide }] },
          ]}
        >
          <Text style={quizStyles.question}>
            Qual o melhor horário para você estudar?
          </Text>

          <View style={quizStyles.chipRow}>
            {TIME_OPTIONS.map((opt, i) => (
              <OnboardingChip
                key={opt}
                label={opt}
                isSelected={selectedTime === opt}
                onPress={() => setSelectedTime(opt)}
                index={i}
                groupOffset={80}
              />
            ))}
          </View>

          <Text style={quizStyles.subQuestion}>
            Quanto tempo por dia?
          </Text>

          <View style={quizStyles.chipRow}>
            {DURATION_OPTIONS.map((opt, i) => (
              <OnboardingChip
                key={opt}
                label={opt}
                isSelected={selectedDuration === opt}
                onPress={() => setSelectedDuration(opt)}
                index={i}
                groupOffset={220}
              />
            ))}
          </View>
        </Animated.View>
      </View>

      <View style={quizStyles.bottomBar}>
        <QuizContinueButton enabled={!!canContinue} onPress={handleContinue} />
      </View>
    </OnboardingLayout>
  );
};

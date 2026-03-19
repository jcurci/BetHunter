import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import { useOnboarding } from '../OnboardingContext';
import { quizStyles } from './quizStyles';
import { OnboardingLayout } from './OnboardingLayout';
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

interface AnimatedChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  index: number;
  groupOffset: number;
}

const AnimatedChip: React.FC<AnimatedChipProps> = ({
  label,
  isSelected,
  onPress,
  index,
  groupOffset,
}) => {
  const mountFade = useRef(new Animated.Value(0)).current;
  const mountScale = useRef(new Animated.Value(0.85)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const selectedAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = groupOffset + index * 60;
    Animated.parallel([
      Animated.timing(mountFade, {
        toValue: 1,
        duration: 280,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(mountScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.spring(selectedAnim, {
      toValue: isSelected ? 1 : 0,
      friction: 5,
      tension: 80,
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressScale, { toValue: 0.92, duration: 70, useNativeDriver: true }),
      Animated.spring(pressScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const borderColor = selectedAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#2B2737', '#D783D8'],
  });

  const backgroundColor = selectedAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1E1B2A', 'rgba(215,131,216,0.15)'],
  });

  return (
    <Animated.View
      style={{
        opacity: mountFade,
        transform: [{ scale: mountScale }, { scale: pressScale }],
      }}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={1}>
        <Animated.View style={[styles.chip, { borderColor, backgroundColor }]}>
          <Text style={[quizStyles.chipText, isSelected && quizStyles.chipTextSelected]}>
            {label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
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
              <AnimatedChip
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
              <AnimatedChip
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

const styles = StyleSheet.create({
  chip: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1.5,
  },
});

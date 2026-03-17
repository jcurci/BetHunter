import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding } from '../OnboardingContext';
import { quizStyles } from './quizStyles';
import { HORIZONTAL_GRADIENT_COLORS, HORIZONTAL_GRADIENT_LOCATIONS } from '../../../config/colors';

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

  const progress = (currentStep + 1) / totalSteps;
  const canContinue = selectedTime && selectedDuration;

  const handleContinue = () => {
    if (selectedTime && selectedDuration) {
      setAnswer('preferredTime', selectedTime);
      setAnswer('dailyDuration', selectedDuration);
      onNext();
    }
  };

  return (
    <SafeAreaView style={quizStyles.safeArea}>
      <View style={quizStyles.container}>
        <View style={quizStyles.progressBarBackground}>
          <LinearGradient
            colors={[...HORIZONTAL_GRADIENT_COLORS]}
            locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: progress, borderRadius: 999 }}
          />
          <View style={{ flex: 1 - progress }} />
        </View>

        <View style={quizStyles.headerRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <Text style={quizStyles.backText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={quizStyles.stepIndicator}>{quizStep} de {quizTotal} — Perfil de aprendizado</Text>
        </View>

        <View style={quizStyles.centerContent}>
          <View style={quizStyles.card}>
            <Text style={quizStyles.question}>
              Qual o melhor horário para você estudar?
            </Text>

            <View style={quizStyles.chipRow}>
              {TIME_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[quizStyles.chip, selectedTime === opt && quizStyles.chipSelected]}
                  onPress={() => setSelectedTime(opt)}
                  activeOpacity={0.8}
                >
                  <Text style={[quizStyles.chipText, selectedTime === opt && quizStyles.chipTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={quizStyles.subQuestion}>
              Quanto tempo por dia?
            </Text>

            <View style={quizStyles.chipRow}>
              {DURATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[quizStyles.chip, selectedDuration === opt && quizStyles.chipSelected]}
                  onPress={() => setSelectedDuration(opt)}
                  activeOpacity={0.8}
                >
                  <Text style={[quizStyles.chipText, selectedDuration === opt && quizStyles.chipTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={quizStyles.bottomBar}>
          <TouchableOpacity onPress={handleContinue} activeOpacity={0.9} disabled={!canContinue}>
            <LinearGradient
              colors={[...HORIZONTAL_GRADIENT_COLORS]}
              locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[quizStyles.gradientButton, !canContinue && quizStyles.gradientButtonDisabled]}
            >
              <Text style={quizStyles.continueButtonText}>Continuar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

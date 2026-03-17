import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding } from '../OnboardingContext';
import { quizStyles } from './quizStyles';
import { HORIZONTAL_GRADIENT_COLORS, HORIZONTAL_GRADIENT_LOCATIONS } from '../../../config/colors';

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

  const progress = (currentStep + 1) / totalSteps;

  const handleContinue = () => {
    if (selected) {
      setAnswer('frequency', selected);
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
            style={[{ flex: progress, borderRadius: 999 }]}
          />
          <View style={{ flex: 1 - progress }} />
        </View>

        <View style={quizStyles.headerRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <Text style={quizStyles.backText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={quizStyles.stepIndicator}>{quizStep} de {quizTotal} — Frequência com apostas</Text>
        </View>

        <View style={quizStyles.centerContent}>
          <View style={quizStyles.card}>
            <Text style={quizStyles.question}>
              Com que frequência você aposta atualmente?
            </Text>

            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[quizStyles.option, selected === opt && quizStyles.optionSelected]}
                onPress={() => setSelected(opt)}
                activeOpacity={0.8}
              >
                <View style={[quizStyles.radio, selected === opt && quizStyles.radioSelected]} />
                <Text style={[quizStyles.optionText, selected === opt && quizStyles.optionTextSelected]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={quizStyles.bottomBar}>
          <TouchableOpacity onPress={handleContinue} activeOpacity={0.9} disabled={!selected}>
            <LinearGradient
              colors={[...HORIZONTAL_GRADIENT_COLORS]}
              locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[quizStyles.gradientButton, !selected && quizStyles.gradientButtonDisabled]}
            >
              <Text style={quizStyles.continueButtonText}>Continuar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

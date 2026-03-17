import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useOnboarding } from '../OnboardingContext';
import { HORIZONTAL_GRADIENT_COLORS, HORIZONTAL_GRADIENT_LOCATIONS } from '../../../config/colors';

type Props = {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
};

type QuestionData = {
  question: string;
  options: { id: string; label: string }[];
  correctId: string;
  betcoins: number;
};

const QUESTIONS: QuestionData[] = [
  {
    question: 'Por que o cérebro ama apostar?',
    options: [
      { id: 'a', label: 'Dopamina' },
      { id: 'b', label: 'Adrenalina' },
      { id: 'c', label: 'Recompensa variável' },
    ],
    correctId: 'a',
    betcoins: 10,
  },
  {
    question: 'Qual o principal gatilho de recaída?',
    options: [
      { id: 'a', label: 'Estresse emocional' },
      { id: 'b', label: 'Falta de dinheiro' },
      { id: 'c', label: 'Tédio' },
    ],
    correctId: 'a',
    betcoins: 10,
  },
  {
    question: 'O que mais ajuda na recuperação?',
    options: [
      { id: 'a', label: 'Força de vontade' },
      { id: 'b', label: 'Rede de apoio + ferramentas' },
      { id: 'c', label: 'Evitar redes sociais' },
    ],
    correctId: 'b',
    betcoins: 10,
  },
];

const TOTAL_QUESTIONS = QUESTIONS.length;

export const FirstLessonScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}) => {
  const { addBetcoins, addXp, setStreak, setFirstLessonCompleted } = useOnboarding();
  const [qIndex, setQIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [totalBetcoins, setTotalBetcoins] = useState(0);

  const feedbackScale = useRef(new Animated.Value(1)).current;
  const coinPop = useRef(new Animated.Value(0)).current;

  const current = QUESTIONS[qIndex];
  const isCorrect = selectedId === current.correctId;
  const progress = (currentStep + 1) / totalSteps;

  const handleSelect = (optionId: string) => {
    if (answered) return;
    setSelectedId(optionId);
    setAnswered(true);

    Animated.sequence([
      Animated.timing(feedbackScale, {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(feedbackScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    if (optionId === current.correctId) {
      setTotalBetcoins((prev) => prev + current.betcoins);

      Animated.sequence([
        Animated.timing(coinPop, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.delay(600),
        Animated.timing(coinPop, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleNext = () => {
    if (qIndex < TOTAL_QUESTIONS - 1) {
      setQIndex((i) => i + 1);
      setSelectedId(null);
      setAnswered(false);
      feedbackScale.setValue(1);
      coinPop.setValue(0);
    } else {
      addBetcoins(totalBetcoins);
      addXp(15);
      setStreak(1);
      setFirstLessonCompleted(true);
      onNext();
    }
  };

  const getOptionStyle = (optId: string) => {
    if (!answered) {
      return selectedId === optId ? styles.optionHighlight : styles.option;
    }
    if (optId === current.correctId) return styles.optionCorrect;
    if (optId === selectedId) return styles.optionWrong;
    return styles.option;
  };

  const getRadioStyle = (optId: string) => {
    if (!answered) return styles.radio;
    if (optId === current.correctId) return styles.radioCorrect;
    if (optId === selectedId) return styles.radioWrong;
    return styles.radio;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.progressBarBackground}>
          <LinearGradient colors={[...HORIZONTAL_GRADIENT_COLORS]} locations={[...HORIZONTAL_GRADIENT_LOCATIONS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: progress, borderRadius: 999 }} />
          <View style={{ flex: 1 - progress }} />
        </View>

        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.stepLabel}>Primeira aula — grátis</Text>
        </View>

        <View style={styles.centerContent}>
          <View>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleTag}>Módulo 1 — Fundamentos</Text>
            </View>

            <Animated.View style={[styles.card, { transform: [{ scale: feedbackScale }] }]}>
              <Text style={styles.question}>{current.question}</Text>

              {current.options.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={getOptionStyle(opt.id)}
                  onPress={() => handleSelect(opt.id)}
                  activeOpacity={0.8}
                  disabled={answered}
                >
                  <View style={getRadioStyle(opt.id)}>
                    {answered && opt.id === current.correctId && (
                      <Icon name="check" size={12} color="#FFF" />
                    )}
                    {answered && opt.id === selectedId && opt.id !== current.correctId && (
                      <Icon name="x" size={12} color="#FFF" />
                    )}
                  </View>
                  <Text style={styles.optionText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>

            <View style={styles.footer}>
              <Text style={styles.questionCounter}>
                Questão {qIndex + 1} de {TOTAL_QUESTIONS}
              </Text>

              <Animated.View
                style={[
                  styles.coinBadge,
                  {
                    opacity: coinPop,
                    transform: [{ scale: coinPop }],
                  },
                ]}
              >
                <Text style={styles.coinText}>+{current.betcoins} Betcoins</Text>
              </Animated.View>
            </View>

            {answered && (
              <View style={styles.feedbackRow}>
                {isCorrect ? (
                  <Text style={styles.feedbackCorrect}>Correto! 🎉</Text>
                ) : (
                  <Text style={styles.feedbackWrong}>
                    Resposta: {current.options.find((o) => o.id === current.correctId)?.label}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handleNext} activeOpacity={0.9} disabled={!answered}>
            <LinearGradient colors={[...HORIZONTAL_GRADIENT_COLORS]} locations={[...HORIZONTAL_GRADIENT_LOCATIONS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.continueButton, !answered && styles.continueDisabled]}>
              <Text style={styles.continueButtonText}>
                {qIndex < TOTAL_QUESTIONS - 1 ? 'Próxima' : 'Finalizar'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#2A2435',
    marginBottom: 16,
  },
  progressBarFill: {
    backgroundColor: '#D783D8',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  stepLabel: {
    color: '#8A8595',
    fontSize: 13,
  },
  moduleHeader: {
    marginBottom: 16,
  },
  moduleTag: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2435',
    marginBottom: 16,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    lineHeight: 26,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#D783D8',
  },
  optionCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2618',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#34C759',
  },
  optionWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A0F0F',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#FF3B54',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#555',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCorrect: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#34C759',
    backgroundColor: '#34C759',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioWrong: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FF3B54',
    backgroundColor: '#FF3B54',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 15,
    color: '#C7C3D1',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionCounter: {
    fontSize: 13,
    color: '#8A8595',
  },
  coinBadge: {
    backgroundColor: '#FFD86620',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  coinText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD866',
  },
  feedbackRow: {
    marginBottom: 8,
  },
  feedbackCorrect: {
    fontSize: 15,
    fontWeight: '600',
    color: '#34C759',
  },
  feedbackWrong: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B54',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomBar: {
    paddingBottom: 36,
    paddingTop: 12,
  },
  continueButton: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

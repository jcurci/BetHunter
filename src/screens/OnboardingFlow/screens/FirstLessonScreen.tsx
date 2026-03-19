import React, { useState, useRef, useEffect } from 'react';
import {
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
import { OnboardingLayout } from './OnboardingLayout';
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
} from '../../../config/colors';

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

interface AnimatedLessonOptionProps {
  optId: string;
  label: string;
  answered: boolean;
  selectedId: string | null;
  correctId: string;
  onPress: () => void;
  index: number;
  questionKey: number;
}

const AnimatedLessonOption: React.FC<AnimatedLessonOptionProps> = ({
  optId,
  label,
  answered,
  selectedId,
  correctId,
  onPress,
  index,
  questionKey,
}) => {
  const mountFade = useRef(new Animated.Value(0)).current;
  const mountSlide = useRef(new Animated.Value(16)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;

  // Reset & stagger mount on question change
  useEffect(() => {
    mountFade.setValue(0);
    mountSlide.setValue(16);
    revealAnim.setValue(0);

    Animated.parallel([
      Animated.timing(mountFade, {
        toValue: 1,
        duration: 280,
        delay: 60 + index * 70,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(mountSlide, {
        toValue: 0,
        duration: 280,
        delay: 60 + index * 70,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [questionKey]);

  // Reveal correct/wrong with a flash
  useEffect(() => {
    if (answered && (optId === correctId || optId === selectedId)) {
      Animated.sequence([
        Animated.timing(revealAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.spring(revealAnim, { toValue: 0, friction: 5, tension: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [answered]);

  const handlePress = () => {
    if (answered) return;
    Animated.sequence([
      Animated.timing(pressScale, { toValue: 0.96, duration: 70, useNativeDriver: true }),
      Animated.spring(pressScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const getOptionStyle = () => {
    if (!answered) {
      return selectedId === optId ? styles.optionHighlight : styles.option;
    }
    if (optId === correctId) return styles.optionCorrect;
    if (optId === selectedId) return styles.optionWrong;
    return styles.optionDim;
  };

  const getRadioStyle = () => {
    if (!answered) {
      return selectedId === optId ? styles.radioHighlight : styles.radio;
    }
    if (optId === correctId) return styles.radioCorrect;
    if (optId === selectedId) return styles.radioWrong;
    return styles.radio;
  };

  const revealScale = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  return (
    <Animated.View
      style={{
        opacity: mountFade,
        transform: [
          { translateY: mountSlide },
          { scale: pressScale },
          { scale: revealScale },
        ],
        marginBottom: 10,
      }}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={1} disabled={answered}>
        <View style={getOptionStyle()}>
          <View style={getRadioStyle()}>
            {answered && optId === correctId && (
              <Icon name="check" size={12} color="#FFF" />
            )}
            {answered && optId === selectedId && optId !== correctId && (
              <Icon name="x" size={12} color="#FFF" />
            )}
          </View>
          <Text
            style={[
              styles.optionText,
              !answered && selectedId === optId && styles.optionTextHighlight,
              answered && optId === correctId && styles.optionTextCorrect,
              answered && optId === selectedId && optId !== correctId && styles.optionTextWrong,
            ]}
          >
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

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

  const cardShake = useRef(new Animated.Value(0)).current;
  const coinPop = useRef(new Animated.Value(0)).current;
  const feedbackFade = useRef(new Animated.Value(0)).current;
  const moduleTagFade = useRef(new Animated.Value(0)).current;

  const current = QUESTIONS[qIndex];
  const isCorrect = selectedId === current.correctId;

  useEffect(() => {
    moduleTagFade.setValue(0);
    Animated.timing(moduleTagFade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [qIndex]);

  const handleSelect = (optionId: string) => {
    if (answered) return;
    setSelectedId(optionId);
    setAnswered(true);

    feedbackFade.setValue(0);

    if (optionId === current.correctId) {
      setTotalBetcoins((prev) => prev + current.betcoins);

      Animated.sequence([
        Animated.spring(coinPop, {
          toValue: 1,
          friction: 3,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(coinPop, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Shake on wrong answer
      Animated.sequence([
        Animated.timing(cardShake, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(cardShake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }

    // Feedback aparece imediatamente sem delay
    Animated.timing(feedbackFade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  const handleNext = () => {
    if (qIndex < TOTAL_QUESTIONS - 1) {
      setQIndex((i) => i + 1);
      setSelectedId(null);
      setAnswered(false);
      cardShake.setValue(0);
      coinPop.setValue(0);
      feedbackFade.setValue(0);
    } else {
      addBetcoins(totalBetcoins);
      addXp(15);
      setStreak(1);
      setFirstLessonCompleted(true);
      onNext();
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      stepLabel="Primeira aula — grátis"
    >
      <View style={styles.centerContent}>
        {/* Module tag */}
        <Animated.View style={[styles.moduleHeader, { opacity: moduleTagFade }]}>
          <LinearGradient
            colors={['rgba(116,86,200,0.2)', 'rgba(116,86,200,0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.moduleTag}
          >
            <Icon name="book-open" size={13} color="#B8A8E8" />
            <Text style={styles.moduleTagText}>Módulo 1 — Fundamentos</Text>
          </LinearGradient>
        </Animated.View>

        {/* Card with shake on wrong */}
        <Animated.View style={{ transform: [{ translateX: cardShake }] }}>
          <View style={styles.card}>
            <Text style={styles.question}>{current.question}</Text>

            {current.options.map((opt, i) => (
              <AnimatedLessonOption
                key={`${qIndex}-${opt.id}`}
                optId={opt.id}
                label={opt.label}
                answered={answered}
                selectedId={selectedId}
                correctId={current.correctId}
                onPress={() => handleSelect(opt.id)}
                index={i}
                questionKey={qIndex}
              />
            ))}
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.progressDots}>
            {QUESTIONS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === qIndex && styles.dotActive,
                  i < qIndex && styles.dotDone,
                ]}
              />
            ))}
          </View>

          <Animated.View
            style={[
              styles.coinBadge,
              {
                opacity: coinPop,
                transform: [
                  { scale: coinPop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                  { translateY: coinPop.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
                ],
              },
            ]}
          >
            <Text style={styles.coinText}>+{current.betcoins} Betcoins 🪙</Text>
          </Animated.View>
        </View>

        {/* Feedback */}
        <Animated.View style={[styles.feedbackRow, { opacity: feedbackFade }]}>
          {answered && (
            isCorrect ? (
              <>
                <Icon name="check-circle" size={16} color="#34C759" />
                <Text style={styles.feedbackCorrect}>Correto! Muito bem 🎉</Text>
              </>
            ) : (
              <>
                <Icon name="x-circle" size={16} color="#FF3B54" />
                <Text style={styles.feedbackWrong}>
                  Resposta: {current.options.find((o) => o.id === current.correctId)?.label}
                </Text>
              </>
            )
          )}
        </Animated.View>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.9}
          disabled={!answered}
        >
          <LinearGradient
            colors={[...HORIZONTAL_GRADIENT_COLORS]}
            locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.continueButton, !answered && styles.continueDisabled]}
          >
            <Text style={styles.continueButtonText}>
              {qIndex < TOTAL_QUESTIONS - 1 ? 'Próxima pergunta →' : 'Finalizar aula →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  moduleHeader: {
    marginBottom: 14,
  },
  moduleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(116,86,200,0.3)',
  },
  moduleTagText: {
    fontSize: 13,
    color: '#B8A8E8',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#16141F',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2B2737',
    marginBottom: 14,
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
    backgroundColor: '#1E1B2A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#2B2737',
  },
  optionHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(215,131,216,0.12)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#D783D8',
  },
  optionCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#34C759',
  },
  optionWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,59,84,0.12)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#FF3B54',
  },
  optionDim: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18161F',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#201E2C',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#3D3850',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioHighlight: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D783D8',
    backgroundColor: '#D783D8',
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
    color: '#A09BAE',
    flex: 1,
  },
  optionTextHighlight: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  optionTextCorrect: {
    color: '#34C759',
    fontWeight: '700',
  },
  optionTextWrong: {
    color: '#FF3B54',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2B2737',
  },
  dotActive: {
    backgroundColor: '#D783D8',
    width: 22,
    borderRadius: 4,
  },
  dotDone: {
    backgroundColor: '#7456C8',
  },
  coinBadge: {
    backgroundColor: 'rgba(255,216,102,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,216,102,0.35)',
  },
  coinText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD866',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    minHeight: 24,
  },
  feedbackCorrect: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  feedbackWrong: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B54',
  },
  bottomBar: {
    paddingBottom: 36,
    paddingTop: 12,
  },
  continueButton: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueDisabled: {
    opacity: 0.35,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR')}`;
}

export const FinancialProjectionScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}) => {
  const { profile } = useOnboarding();
  const monthlySpend = profile?.monthlySpend ?? 100;
  const projectedSavings = profile?.projectedSavings ?? 1_200;

  const [displayValue, setDisplayValue] = useState(0);
  const counterAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(counterAnim, {
          toValue: projectedSavings,
          duration: 2000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 5,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const listener = counterAnim.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });

    return () => counterAnim.removeListener(listener);
  }, []);

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      stepLabel="Projeção personalizada"
    >
      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        <Text style={styles.title}>
          Com base nas suas respostas, você pode recuperar:
        </Text>

        <Animated.View style={[{ transform: [{ scale: cardScale }], width: '100%' }]}>
          <LinearGradient
            colors={['#0D2018', '#0F2F1A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.savingsCard}
          >
            <Text style={styles.savingsValue}>
              {formatCurrency(displayValue)}
            </Text>
            <Text style={styles.savingsPeriod}>
              em 12 meses parando de apostar
            </Text>
          </LinearGradient>
        </Animated.View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B35' }]} />
            <Text style={styles.legendText}>
              Base {formatCurrency(monthlySpend)}/mês estimado em apostas
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
            <Text style={styles.legendText}>
              Potencial de investimento gerado
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.bottomBar, { opacity: fadeIn }]}>
        <TouchableOpacity onPress={onNext} activeOpacity={0.9}>
          <LinearGradient
            colors={[...HORIZONTAL_GRADIENT_COLORS]}
            locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Ver meu plano →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  savingsCard: {
    width: '100%',
    borderRadius: 22,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#1E4A28',
  },
  savingsValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#34C759',
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  savingsPeriod: {
    fontSize: 15,
    color: '#6CB87A',
    fontWeight: '500',
  },
  legendContainer: {
    width: '100%',
    gap: 14,
    backgroundColor: '#16141F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2B2737',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 14,
    color: '#A09BAE',
    flex: 1,
    lineHeight: 20,
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
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

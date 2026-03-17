import React, { useEffect, useRef, useState } from 'react';
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
import { useOnboarding } from '../OnboardingContext';
import { HORIZONTAL_GRADIENT_COLORS, HORIZONTAL_GRADIENT_LOCATIONS } from '../../../config/colors';

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
  const cardScale = useRef(new Animated.Value(0.92)).current;

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
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const listener = counterAnim.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });

    return () => counterAnim.removeListener(listener);
  }, []);

  const progress = (currentStep + 1) / totalSteps;

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
          <Text style={styles.stepLabel}>Projeção personalizada</Text>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeIn }]}>
          <Text style={styles.title}>
            Com base nas suas respostas, você pode recuperar:
          </Text>

          <Animated.View style={[styles.savingsCard, { transform: [{ scale: cardScale }] }]}>
            <Text style={styles.savingsValue}>
              {formatCurrency(displayValue)}
            </Text>
            <Text style={styles.savingsPeriod}>
              em 12 meses parando de apostar
            </Text>
          </Animated.View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF3B54' }]} />
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
            <LinearGradient colors={[...HORIZONTAL_GRADIENT_COLORS]} locations={[...HORIZONTAL_GRADIENT_LOCATIONS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Continuar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
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
    marginBottom: 32,
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  savingsCard: {
    width: '100%',
    backgroundColor: '#0F2618',
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#1A3A1F',
  },
  savingsValue: {
    fontSize: 44,
    fontWeight: '800',
    color: '#34C759',
    marginBottom: 8,
  },
  savingsPeriod: {
    fontSize: 15,
    color: '#6CB87A',
    fontWeight: '500',
  },
  legendContainer: {
    width: '100%',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

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

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export const CounterActivationScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}) => {
  const { sobrietyStartDate, setSobrietyStartDate } = useOnboarding();
  const [elapsed, setElapsed] = useState({ days: 0, hours: 0, minutes: 0 });
  const [started, setStarted] = useState(!!sobrietyStartDate);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!sobrietyStartDate) return;

    const tick = () => {
      const start = new Date(sobrietyStartDate).getTime();
      const diff = Math.max(0, Date.now() - start);
      const totalMinutes = Math.floor(diff / 60000);
      const totalHours = Math.floor(totalMinutes / 60);
      setElapsed({
        days: Math.floor(totalHours / 24),
        hours: totalHours % 24,
        minutes: totalMinutes % 60,
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sobrietyStartDate]);

  useEffect(() => {
    if (!started) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [started]);

  const handleStart = () => {
    const now = new Date().toISOString();
    setSobrietyStartDate(now);
    setStarted(true);
  };

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
          <Text style={styles.stepLabel}>Contador de sobriedade</Text>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeIn }]}>
          <Text style={styles.subtitle}>Você está livre há</Text>

          <Animated.View style={[styles.counterCard, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.counterRow}>
              <View style={styles.counterUnit}>
                <Text style={styles.counterNumber}>{padZero(elapsed.days)}</Text>
                <Text style={styles.counterLabel}>d</Text>
              </View>
              <View style={styles.counterUnit}>
                <Text style={styles.counterNumber}>{padZero(elapsed.hours)}</Text>
                <Text style={styles.counterLabel}>h</Text>
              </View>
              <View style={styles.counterUnit}>
                <Text style={styles.counterNumber}>{padZero(elapsed.minutes)}</Text>
                <Text style={styles.counterLabel}>min</Text>
              </View>
            </View>
            <Text style={styles.counterCaption}>A partir de agora é...</Text>
          </Animated.View>

          <View style={styles.messageCard}>
            <Text style={styles.messageEmoji}>⏱</Text>
            <Text style={styles.messageTitle}>Esta é sua hora zero.</Text>
            <Text style={styles.messageBody}>Cada minuto conta.</Text>
          </View>
        </Animated.View>

        <View style={styles.bottomBar}>
          {!started ? (
            <TouchableOpacity onPress={handleStart} activeOpacity={0.9}>
              <LinearGradient colors={[...HORIZONTAL_GRADIENT_COLORS]} locations={[...HORIZONTAL_GRADIENT_LOCATIONS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startButton}>
                <Text style={styles.startButtonText}>Começar minha jornada</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onNext} activeOpacity={0.9}>
              <LinearGradient colors={[...HORIZONTAL_GRADIENT_COLORS]} locations={[...HORIZONTAL_GRADIENT_LOCATIONS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.continueButton}>
                <Text style={styles.continueButtonText}>Continuar</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
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
    marginBottom: 24,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8A8595',
    marginBottom: 16,
  },
  counterCard: {
    width: '100%',
    backgroundColor: '#1C1C1C',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A2435',
  },
  counterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  counterUnit: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  counterNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#34C759',
    fontVariant: ['tabular-nums'],
  },
  counterLabel: {
    fontSize: 20,
    color: '#6CB87A',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 2,
  },
  counterCaption: {
    fontSize: 14,
    color: '#6E6A78',
  },
  messageCard: {
    width: '100%',
    backgroundColor: '#1A1235',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E2450',
  },
  messageEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  messageTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  messageBody: {
    fontSize: 14,
    color: '#A09BAE',
  },
  bottomBar: {
    paddingBottom: 36,
    paddingTop: 12,
  },
  startButton: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
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

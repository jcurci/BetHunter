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

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

interface FlipDigitProps {
  value: string;
  color: string;
}

const FlipDigit: React.FC<FlipDigitProps> = ({ value, color }) => {
  const prevValue = useRef(value);
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      flipAnim.setValue(0);
      Animated.sequence([
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(flipAnim, {
          toValue: 0,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [value]);

  const translateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const scale = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.08, 1],
  });

  return (
    <Animated.Text
      style={[
        styles.counterNumber,
        { color, transform: [{ translateY }, { scale }] },
      ]}
    >
      {value}
    </Animated.Text>
  );
};

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
  const subtitleSlide = useRef(new Animated.Value(12)).current;
  const counterCardScale = useRef(new Animated.Value(0.92)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const messageSlide = useRef(new Animated.Value(20)).current;
  const messageFade = useRef(new Animated.Value(0)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(subtitleSlide, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(counterCardScale, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(messageFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(messageSlide, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(buttonFade, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Glow pulse on counter card
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    glowLoop.start();

    return () => glowLoop.stop();
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

    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.025, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    pulseRef.current.start();
    return () => pulseRef.current?.stop();
  }, [started]);

  const handleStart = () => {
    const now = new Date().toISOString();
    setSobrietyStartDate(now);
    setStarted(true);

    // Celebration bounce on the card
    Animated.sequence([
      Animated.spring(counterCardScale, { toValue: 1.05, friction: 4, tension: 60, useNativeDriver: true }),
      Animated.spring(counterCardScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();
  };

  const cardBorderColor = glowAnim.interpolate({
    inputRange: [0.5, 1],
    outputRange: ['#1E3A22', '#2E5A34'],
  });

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      stepLabel="Contador de sobriedade"
    >
      <View style={styles.content}>
        <Animated.Text
          style={[styles.subtitle, { opacity: fadeIn, transform: [{ translateY: subtitleSlide }] }]}
        >
          Você está livre há
        </Animated.Text>

        <Animated.View style={{ transform: [{ scale: started ? pulseAnim : counterCardScale }], width: '100%' }}>
          <Animated.View style={[styles.counterCard, { borderColor: cardBorderColor }]}>
            <View style={styles.counterRow}>
              <View style={styles.counterUnit}>
                <FlipDigit value={padZero(elapsed.days)} color="#34C759" />
                <Text style={styles.counterLabel}>d</Text>
              </View>
              <Text style={styles.counterSeparator}>:</Text>
              <View style={styles.counterUnit}>
                <FlipDigit value={padZero(elapsed.hours)} color="#34C759" />
                <Text style={styles.counterLabel}>h</Text>
              </View>
              <Text style={styles.counterSeparator}>:</Text>
              <View style={styles.counterUnit}>
                <FlipDigit value={padZero(elapsed.minutes)} color="#34C759" />
                <Text style={styles.counterLabel}>min</Text>
              </View>
            </View>

            {started && (
              <View style={styles.activeBadge}>
                <Animated.View style={[styles.activeDot, { opacity: glowAnim }]} />
                <Text style={styles.activeText}>Contador ativo</Text>
              </View>
            )}
          </Animated.View>
        </Animated.View>

        {/* Message card */}
        <Animated.View
          style={[
            styles.messageCard,
            { opacity: messageFade, transform: [{ translateY: messageSlide }] },
          ]}
        >
          <LinearGradient
            colors={['rgba(52,199,89,0.1)', 'rgba(52,199,89,0.04)']}
            style={styles.messageGradient}
          >
            <Text style={styles.messageTitle}>Esta é sua hora zero.</Text>
            <Text style={styles.messageBody}>Cada minuto conta.</Text>
          </LinearGradient>
        </Animated.View>

        {/* Motivation row */}
        <Animated.View
          style={[styles.motivationRow, { opacity: messageFade }]}
        >
          {[
            { emoji: '🧠', text: 'Clareza mental' },
            { emoji: '💰', text: 'Economia real' },
            { emoji: '❤️', text: 'Saúde emocional' },
          ].map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.motivationDivider} />}
              <View style={styles.motivationItem}>
                <Text style={styles.motivationEmoji}>{item.emoji}</Text>
                <Text style={styles.motivationText}>{item.text}</Text>
              </View>
            </React.Fragment>
          ))}
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottomBar, { opacity: buttonFade }]}>
        {!started ? (
          <TouchableOpacity onPress={handleStart} activeOpacity={0.9}>
            <LinearGradient
              colors={[...HORIZONTAL_GRADIENT_COLORS]}
              locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButton}
            >
              <Text style={styles.startButtonText}>🚀  Começar minha jornada</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onNext} activeOpacity={0.9}>
            <LinearGradient
              colors={[...HORIZONTAL_GRADIENT_COLORS]}
              locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>Continuar →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </Animated.View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#8A8595',
    fontWeight: '500',
  },
  counterCard: {
    width: '100%',
    backgroundColor: '#0F1F12',
    borderRadius: 22,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 12,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  counterUnit: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  counterNumber: {
    fontSize: 52,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  counterLabel: {
    fontSize: 20,
    color: '#5AA86B',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 2,
  },
  counterSeparator: {
    fontSize: 40,
    color: '#3A7A46',
    fontWeight: '700',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52,199,89,0.15)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  activeText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  messageCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.2)',
  },
  messageGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  messageBody: {
    fontSize: 14,
    color: '#7EC896',
    fontWeight: '500',
  },
  motivationRow: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#16141F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2B2737',
    paddingVertical: 16,
  },
  motivationItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  motivationEmoji: {
    fontSize: 22,
  },
  motivationText: {
    fontSize: 12,
    color: '#8A8595',
    fontWeight: '500',
    textAlign: 'center',
  },
  motivationDivider: {
    width: 1,
    backgroundColor: '#2B2737',
    marginVertical: 4,
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
    letterSpacing: 0.3,
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

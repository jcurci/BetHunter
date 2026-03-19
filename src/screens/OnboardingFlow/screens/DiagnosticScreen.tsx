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
import Icon from 'react-native-vector-icons/Feather';
import { useOnboarding } from '../OnboardingContext';
import { calculateProfile, RiskLevel } from '../calculateProfile';
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

const RISK_COLORS: Record<RiskLevel, string> = {
  BAIXO: '#34C759',
  MODERADO: '#FFD866',
  ALTO: '#FF6B35',
  'CRÍTICO': '#FF3B54',
};

const RISK_LABEL: Record<RiskLevel, string> = {
  BAIXO: 'Baixo',
  MODERADO: 'Moderado-alto',
  ALTO: 'Alto',
  'CRÍTICO': 'Crítico',
};

const LOADING_STEPS = [
  'Analisando padrão de apostas...',
  'Calculando perfil de risco...',
  'Mapeando gatilhos emocionais...',
  'Criando plano personalizado...',
];

export const DiagnosticScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}) => {
  const { answers, setProfile } = useOnboarding();
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const result = calculateProfile(answers);

  // Loading animations
  const spinAnim = useRef(new Animated.Value(0)).current;
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const dotPulse = useRef(new Animated.Value(0.4)).current;
  const loadingTextFade = useRef(new Animated.Value(1)).current;
  const progressBar = useRef(new Animated.Value(0)).current;

  // Reveal animations
  const avatarScale = useRef(new Animated.Value(0)).current;
  const avatarFade = useRef(new Animated.Value(0)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(16)).current;
  const profileCardFade = useRef(new Animated.Value(0)).current;
  const profileCardSlide = useRef(new Animated.Value(20)).current;
  const miniCard1Scale = useRef(new Animated.Value(0)).current;
  const miniCard2Scale = useRef(new Animated.Value(0)).current;
  const summaryFade = useRef(new Animated.Value(0)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setProfile(result);

    // Main spinner
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spinLoop.start();

    // Orbit dot
    const orbitLoop = Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    orbitLoop.start();

    // Dot pulse
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotPulse, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ]),
    );
    dotLoop.start();

    // Progress bar fill
    Animated.timing(progressBar, {
      toValue: 1,
      duration: 2200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // Step text cycling
    const stepTimers = LOADING_STEPS.map((_, i) =>
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(loadingTextFade, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(loadingTextFade, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start(() => setLoadingStep(i));
      }, i * 600),
    );

    const revealTimer = setTimeout(() => {
      spinLoop.stop();
      orbitLoop.stop();
      dotLoop.stop();
      setLoading(false);

      // Dramatic staggered reveal
      Animated.sequence([
        Animated.parallel([
          Animated.spring(avatarScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
          Animated.timing(avatarFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(titleFade, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(titleSlide, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(profileCardFade, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(profileCardSlide, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.stagger(80, [
          Animated.spring(miniCard1Scale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
          Animated.spring(miniCard2Scale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
        ]),
        Animated.timing(summaryFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(buttonFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }, 2600);

    return () => {
      spinLoop.stop();
      orbitLoop.stop();
      dotLoop.stop();
      clearTimeout(revealTimer);
      stepTimers.forEach(clearTimeout);
    };
  }, []);

  const riskColor = RISK_COLORS[result.riskLevel];

  const spinDeg = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const orbitDeg = orbitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressBar.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (loading) {
    return (
      <OnboardingLayout currentStep={currentStep} totalSteps={totalSteps}>
        <View style={styles.loadingCenter}>
          {/* Orbital spinner */}
          <View style={styles.spinnerContainer}>
            {/* Outer orbit ring */}
            <Animated.View style={[styles.orbitRing, { transform: [{ rotate: orbitDeg }] }]}>
              <View style={styles.orbitDot} />
            </Animated.View>

            {/* Inner gradient arc */}
            <Animated.View style={[styles.spinnerInner, { transform: [{ rotate: spinDeg }] }]}>
              <LinearGradient
                colors={['transparent', '#7456C8', '#D783D8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientArc}
              />
            </Animated.View>

            {/* Center */}
            <View style={styles.spinnerCenter}>
              <Icon name="cpu" size={22} color="#D783D8" />
            </View>
          </View>

          <Text style={styles.loadingTitle}>Analisando respostas</Text>

          <Animated.Text style={[styles.loadingStep, { opacity: loadingTextFade }]}>
            {LOADING_STEPS[loadingStep]}
          </Animated.Text>

          {/* Progress bar */}
          <View style={styles.loadingProgressBg}>
            <Animated.View style={[styles.loadingProgressFill, { width: progressWidth }]}>
              <LinearGradient
                colors={[...HORIZONTAL_GRADIENT_COLORS]}
                locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1, borderRadius: 999 }}
              />
            </Animated.View>
          </View>

          {/* Pulsing dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.pulsingDot,
                  {
                    opacity: dotPulse,
                    transform: [{
                      scale: dotPulse.interpolate({
                        inputRange: [0.4, 1],
                        outputRange: [0.7, 1],
                      }),
                    }],
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      stepLabel="Seu diagnóstico"
    >
      <View style={styles.content}>
        {/* Avatar */}
        <Animated.View
          style={[
            styles.avatarWrapper,
            { opacity: avatarFade, transform: [{ scale: avatarScale }] },
          ]}
        >
          <LinearGradient
            colors={[...HORIZONTAL_GRADIENT_COLORS]}
            locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.avatarGradientBorder}
          >
            <View style={styles.avatarInner}>
              <Icon name="user" size={30} color="#D783D8" />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          style={[
            styles.readyText,
            { opacity: titleFade, transform: [{ translateY: titleSlide }] },
          ]}
        >
          Seu perfil está pronto
        </Animated.Text>

        {/* Profile Card */}
        <Animated.View
          style={[
            styles.profileCard,
            { opacity: profileCardFade, transform: [{ translateY: profileCardSlide }] },
          ]}
        >
          <Text style={styles.profileLabel}>Seu tipo de perfil</Text>
          <Text style={[styles.profileType, { color: riskColor }]}>
            {result.profileType}
          </Text>
          <View style={styles.riskBadge}>
            <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
            <Text style={styles.riskSubtitle}>
              Nível de risco: {RISK_LABEL[result.riskLevel]}
            </Text>
          </View>
        </Animated.View>

        {/* Mini Cards */}
        <View style={styles.miniCardsRow}>
          <Animated.View
            style={[styles.miniCard, { transform: [{ scale: miniCard1Scale }] }]}
          >
            <View style={[styles.miniCardIcon, { backgroundColor: 'rgba(116,86,200,0.2)' }]}>
              <Icon name="shield" size={18} color="#7456C8" />
            </View>
            <Text style={styles.miniCardLabel}>Trilha</Text>
            <Text style={styles.miniCardValue}>{result.track}</Text>
          </Animated.View>
          <Animated.View
            style={[styles.miniCard, { transform: [{ scale: miniCard2Scale }] }]}
          >
            <View style={[styles.miniCardIcon, { backgroundColor: 'rgba(255,107,53,0.2)' }]}>
              <Icon name="target" size={18} color="#FF6B35" />
            </View>
            <Text style={styles.miniCardLabel}>Foco</Text>
            <Text style={styles.miniCardValue}>{result.focus}</Text>
          </Animated.View>
        </View>

        {/* Summary */}
        <Animated.View style={[styles.summaryCard, { opacity: summaryFade }]}>
          <Text style={styles.summaryText}>{result.profileSummary}</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottomBar, { opacity: buttonFade }]}>
        <TouchableOpacity onPress={onNext} activeOpacity={0.9}>
          <LinearGradient
            colors={[...HORIZONTAL_GRADIENT_COLORS]}
            locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Ver minha projeção →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  spinnerContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
  },
  orbitDot: {
    position: 'absolute',
    top: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF90A5',
    shadowColor: '#FF90A5',
    shadowRadius: 6,
    shadowOpacity: 0.8,
  },
  spinnerInner: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  gradientArc: {
    flex: 1,
    borderRadius: 40,
    opacity: 0.8,
  },
  spinnerCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1C1025',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2B2737',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingStep: {
    fontSize: 14,
    color: '#B8A8E8',
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingProgressBg: {
    width: '80%',
    height: 4,
    backgroundColor: '#2A2435',
    borderRadius: 999,
    overflow: 'hidden',
  },
  loadingProgressFill: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7456C8',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatarGradientBorder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2A1A35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileCard: {
    width: '100%',
    backgroundColor: '#16141F',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2B2737',
  },
  profileLabel: {
    fontSize: 12,
    color: '#8A8595',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  profileType: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskSubtitle: {
    fontSize: 13,
    color: '#8A8595',
    fontWeight: '500',
  },
  miniCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    width: '100%',
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#16141F',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B2737',
    gap: 8,
  },
  miniCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCardLabel: {
    fontSize: 12,
    color: '#8A8595',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniCardValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: 'rgba(116,86,200,0.08)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(116,86,200,0.2)',
  },
  summaryText: {
    fontSize: 14,
    color: '#C7C3D1',
    textAlign: 'center',
    lineHeight: 21,
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

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
import Icon from 'react-native-vector-icons/Feather';
import { useOnboarding } from '../OnboardingContext';
import { calculateProfile, RiskLevel } from '../calculateProfile';
import { HORIZONTAL_GRADIENT_COLORS, HORIZONTAL_GRADIENT_LOCATIONS } from '../../../config/colors';

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

export const DiagnosticScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}) => {
  const { answers, setProfile } = useOnboarding();
  const [loading, setLoading] = useState(true);
  const result = calculateProfile(answers);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeProfile = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    setProfile(result);

    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spin.start();

    const timer = setTimeout(() => {
      spin.stop();
      setLoading(false);

      Animated.parallel([
        Animated.timing(fadeProfile, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 1500);

    return () => {
      clearTimeout(timer);
      spin.stop();
    };
  }, []);

  const progress = (currentStep + 1) / totalSteps;
  const riskColor = RISK_COLORS[result.riskLevel];

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.progressBarBackground}>
            <LinearGradient colors={[...HORIZONTAL_GRADIENT_COLORS]} locations={[...HORIZONTAL_GRADIENT_LOCATIONS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: progress, borderRadius: 999 }} />
            <View style={{ flex: 1 - progress }} />
          </View>

          <View style={styles.loadingCenter}>
            <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
              <View style={styles.loadingCircle}>
                <Icon name="loader" size={32} color="#D783D8" />
              </View>
            </Animated.View>
            <Text style={styles.loadingText}>Analisando suas respostas...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
        </View>

        <Animated.View
          style={[
            styles.content,
            { opacity: fadeProfile, transform: [{ translateY: slideUp }] },
          ]}
        >
          <View style={styles.avatarCircle}>
            <Icon name="user" size={32} color="#D783D8" />
          </View>

          <Text style={styles.readyText}>Seu perfil está pronto</Text>

          <View style={styles.profileCard}>
            <Text style={styles.profileLabel}>Seu tipo de perfil</Text>
            <Text style={[styles.profileType, { color: riskColor }]}>
              {result.profileType}
            </Text>
            <Text style={styles.riskSubtitle}>
              Nível de risco: {RISK_LABEL[result.riskLevel]}
            </Text>
          </View>

          <View style={styles.miniCardsRow}>
            <View style={styles.miniCard}>
              <Icon name="shield" size={18} color="#D783D8" />
              <Text style={styles.miniCardLabel}>Trilha</Text>
              <Text style={styles.miniCardValue}>{result.track}</Text>
            </View>
            <View style={styles.miniCard}>
              <Icon name="target" size={18} color="#FF6B35" />
              <Text style={styles.miniCardLabel}>Foco</Text>
              <Text style={styles.miniCardValue}>{result.focus}</Text>
            </View>
          </View>

          <Text style={styles.summaryText}>{result.profileSummary}</Text>
        </Animated.View>

        <Animated.View style={[styles.bottomBar, { opacity: fadeProfile }]}>
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
    marginBottom: 16,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1C1025',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#8A8595',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2A1A35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  readyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  profileCard: {
    width: '100%',
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2435',
  },
  profileLabel: {
    fontSize: 12,
    color: '#8A8595',
    fontWeight: '600',
    marginBottom: 6,
  },
  profileType: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  riskSubtitle: {
    fontSize: 13,
    color: '#6E6A78',
  },
  miniCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#1C1C1C',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2435',
    gap: 6,
  },
  miniCardLabel: {
    fontSize: 12,
    color: '#8A8595',
    fontWeight: '600',
  },
  miniCardValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryText: {
    fontSize: 14,
    color: '#A09BAE',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
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

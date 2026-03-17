import React, { useEffect, useRef } from 'react';
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

type Feature = {
  icon: string;
  color: string;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: 'book-open',
    color: '#6366F1',
    title: 'Curso: Fundamentos',
    description: '37 aulas · começa hoje',
  },
  {
    icon: 'heart',
    color: '#D783D8',
    title: 'Modo meditação',
    description: 'Para momentos de crise',
  },
  {
    icon: 'shield',
    color: '#FF3B54',
    title: 'Bloqueio de apps',
    description: 'Sites e apps de apostas',
  },
  {
    icon: 'trending-up',
    color: '#34C759',
    title: 'Controle financeiro',
    description: 'Entradas e saídas do seu dinheiro',
  },
  {
    icon: 'award',
    color: '#FFD866',
    title: 'Quiz educacional',
    description: 'Teste seus conhecimentos',
  },
];

export const PlanPreviewScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}) => {
  const { profile } = useOnboarding();
  const mainGoal = profile?.mainGoal ?? 'Parar de apostar de vez';

  const fadeAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(FEATURES.map(() => new Animated.Value(24))).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    const staggerAnimations = FEATURES.map((_, i) =>
      Animated.parallel([
        Animated.timing(fadeAnims[i], {
          toValue: 1,
          duration: 400,
          delay: 200 + i * 120,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnims[i], {
          toValue: 0,
          duration: 400,
          delay: 200 + i * 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.parallel(staggerAnimations).start();
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
          <Text style={styles.stepLabel}>Seu plano foi criado</Text>
        </View>

        <Animated.View style={{ opacity: headerFade }}>
          <Text style={styles.title}>O que te espera na jornada</Text>
          <Text style={styles.subtitle}>
            Plano personalizado para: {mainGoal.toLowerCase()}
          </Text>
        </Animated.View>

        <View style={styles.featuresList}>
          {FEATURES.map((feat, i) => (
            <Animated.View
              key={feat.title}
              style={[
                styles.featureCard,
                {
                  opacity: fadeAnims[i],
                  transform: [{ translateY: slideAnims[i] }],
                },
              ]}
            >
              <View style={[styles.featureIcon, { backgroundColor: feat.color + '1A' }]}>
                <Icon name={feat.icon} size={20} color={feat.color} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feat.title}</Text>
                <Text style={styles.featureDesc}>{feat.description}</Text>
              </View>
              <Icon name="chevron-right" size={18} color="#555" />
            </Animated.View>
          ))}
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={onNext} activeOpacity={0.9}>
            <LinearGradient colors={[...HORIZONTAL_GRADIENT_COLORS]} locations={[...HORIZONTAL_GRADIENT_LOCATIONS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Continuar</Text>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#8A8595',
    marginBottom: 28,
  },
  featuresList: {
    flex: 1,
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2435',
    gap: 14,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: '#8A8595',
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

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
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

type Feature = {
  icon: string;
  color: string;
  bg: string;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: 'book-open',
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.15)',
    title: 'Curso: Fundamentos',
    description: '27 aulas · começa hoje',
  },
  {
    icon: 'heart',
    color: '#D783D8',
    bg: 'rgba(215,131,216,0.15)',
    title: 'Modo meditação',
    description: 'Para momentos de crise',
  },
  {
    icon: 'shield',
    color: '#FF3B54',
    bg: 'rgba(255,59,84,0.15)',
    title: 'Bloqueio de apps',
    description: 'Sites e apps de apostas',
  },
  {
    icon: 'trending-up',
    color: '#34C759',
    bg: 'rgba(52,199,89,0.15)',
    title: 'Controle financeiro',
    description: 'Entradas e saídas do seu dinheiro',
  },
  {
    icon: 'award',
    color: '#FFD866',
    bg: 'rgba(255,216,102,0.15)',
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
          delay: 200 + i * 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnims[i], {
          toValue: 0,
          duration: 400,
          delay: 200 + i * 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.parallel(staggerAnimations).start();
  }, []);

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      stepLabel="Seu plano foi criado"
    >
      <Animated.View style={{ opacity: headerFade, marginBottom: 20 }}>
        <Text style={styles.title}>O que te espera na jornada</Text>
        <View style={styles.goalBadge}>
          <Icon name="target" size={13} color="#D783D8" />
          <Text style={styles.goalText}>
            Meta: {mainGoal.toLowerCase()}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.featuresList}
      >
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
            <View style={[styles.featureIcon, { backgroundColor: feat.bg }]}>
              <Icon name={feat.icon} size={20} color={feat.color} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feat.title}</Text>
              <Text style={styles.featureDesc}>{feat.description}</Text>
            </View>
            <View style={styles.chevronContainer}>
              <Icon name="chevron-right" size={16} color="#555" />
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={onNext} activeOpacity={0.9}>
          <LinearGradient
            colors={[...HORIZONTAL_GRADIENT_COLORS]}
            locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Começar minha jornada →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(215,131,216,0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(215,131,216,0.25)',
  },
  goalText: {
    fontSize: 13,
    color: '#D783D8',
    fontWeight: '600',
  },
  featuresList: {
    gap: 10,
    paddingBottom: 8,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16141F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2B2737',
    gap: 14,
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
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
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 13,
    color: '#8A8595',
  },
  chevronContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#2B2737',
    alignItems: 'center',
    justifyContent: 'center',
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

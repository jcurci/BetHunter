import React, { useEffect, useRef, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COUNT = 30;
const CONFETTI_COLORS = ['#D783D8', '#34C759', '#FFD866', '#6366F1', '#FF3B54', '#00C9FF'];

function ConfettiPiece({ delay, color }: { delay: number; color: string }) {
  const fallAnim = useRef(new Animated.Value(0)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;
  const startX = useMemo(() => Math.random() * SCREEN_WIDTH, []);
  const size = useMemo(() => 6 + Math.random() * 6, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fallAnim, {
        toValue: 1,
        duration: 2500 + Math.random() * 1500,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(swayAnim, {
            toValue: 1,
            duration: 400 + Math.random() * 300,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(swayAnim, {
            toValue: -1,
            duration: 400 + Math.random() * 300,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, []);

  const translateY = fallAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, SCREEN_HEIGHT + 40],
  });
  const translateX = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-20, 20],
  });
  const opacity = fallAnim.interpolate({
    inputRange: [0, 0.1, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: 0,
        width: size,
        height: size * 1.5,
        borderRadius: 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }],
      }}
    />
  );
}

export const CelebrationScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}) => {
  const { betcoinsEarned, xpEarned, streak } = useOnboarding();

  const fadeIn = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const stat1 = useRef(new Animated.Value(0)).current;
  const stat2 = useRef(new Animated.Value(0)).current;
  const stat3 = useRef(new Animated.Value(0)).current;
  const cardFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.stagger(150, [
        Animated.spring(stat1, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
        Animated.spring(stat2, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
        Animated.spring(stat3, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
      ]),
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const progress = (currentStep + 1) / totalSteps;

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        key: i,
        delay: Math.random() * 600,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {confettiPieces.map((c) => (
        <ConfettiPiece key={c.key} delay={c.delay} color={c.color} />
      ))}

      <View style={styles.container}>
        <View style={styles.progressBarBackground}>
          <LinearGradient colors={[...HORIZONTAL_GRADIENT_COLORS]} locations={[...HORIZONTAL_GRADIENT_LOCATIONS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: progress, borderRadius: 999 }} />
          <View style={{ flex: 1 - progress }} />
        </View>

        <Animated.View style={[styles.content, { opacity: fadeIn }]}>
          <Animated.View style={[styles.trophyCircle, { transform: [{ scale: badgeScale }] }]}>
            <Text style={styles.trophyEmoji}>🎉</Text>
          </Animated.View>

          <Text style={styles.title}>Você ganhou!</Text>
          <Text style={styles.subtitle}>Primeira lição concluída</Text>

          <View style={styles.statsRow}>
            <Animated.View style={[styles.statCard, { transform: [{ scale: stat1 }] }]}>
              <Text style={[styles.statValue, { color: '#FFD866' }]}>+{betcoinsEarned}</Text>
              <Text style={styles.statLabel}>Betcoins</Text>
            </Animated.View>
            <Animated.View style={[styles.statCard, { transform: [{ scale: stat2 }] }]}>
              <Text style={[styles.statValue, { color: '#6366F1' }]}>+{xpEarned}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </Animated.View>
            <Animated.View style={[styles.statCard, { transform: [{ scale: stat3 }] }]}>
              <Text style={[styles.statValue, { color: '#FF6B35' }]}>🔥{streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </Animated.View>
          </View>

          <Animated.View style={[styles.rankingCard, { opacity: cardFade }]}>
            <Icon name="trending-up" size={18} color="#34C759" />
            <Text style={styles.rankingText}>
              Você está no <Text style={styles.rankingBold}>4º lugar</Text> entre novos usuários de hoje 🎉
            </Text>
          </Animated.View>
        </Animated.View>

        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={onNext} activeOpacity={0.9}>
            <LinearGradient colors={[...HORIZONTAL_GRADIENT_COLORS]} locations={[...HORIZONTAL_GRADIENT_LOCATIONS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Ver meu plano completo →</Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2A1A35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  trophyEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#8A8595',
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1C1C1C',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2435',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8A8595',
    fontWeight: '600',
  },
  rankingCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2A2435',
  },
  rankingText: {
    fontSize: 14,
    color: '#A09BAE',
    flex: 1,
    lineHeight: 20,
  },
  rankingBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomBar: {
    paddingBottom: 36,
    paddingTop: 12,
  },
  ctaButton: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

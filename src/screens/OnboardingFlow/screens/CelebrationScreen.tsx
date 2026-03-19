import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COUNT = 50;
const CONFETTI_COLORS = ['#D783D8', '#34C759', '#FFD866', '#6366F1', '#FF6A56', '#7456C8', '#FF90A5', '#00C9FF'];

function ConfettiPiece({ delay, color, startX }: { delay: number; color: string; startX: number }) {
  const fallAnim = useRef(new Animated.Value(0)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const size = useMemo(() => 4 + Math.random() * 9, []);
  const isRound = useMemo(() => Math.random() > 0.5, []);
  const swayAmount = useMemo(() => 12 + Math.random() * 22, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fallAnim, {
        toValue: 1,
        duration: 2000 + Math.random() * 2000,
        delay,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(swayAnim, {
            toValue: 1,
            duration: 300 + Math.random() * 300,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(swayAnim, {
            toValue: -1,
            duration: 300 + Math.random() * 300,
            useNativeDriver: true,
          }),
        ]),
      ),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 500 + Math.random() * 500,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    ]).start();
  }, []);

  const translateY = fallAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, SCREEN_HEIGHT + 50],
  });
  const translateX = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-swayAmount, swayAmount],
  });
  const opacity = fallAnim.interpolate({
    inputRange: [0, 0.06, 0.88, 1],
    outputRange: [0, 1, 1, 0],
  });
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: 0,
        width: size,
        height: isRound ? size : size * 2,
        borderRadius: isRound ? size / 2 : 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}

interface StatBubbleProps {
  value: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  delay: number;
}

const StatBubble: React.FC<StatBubbleProps> = ({ value, label, icon, color, bgColor, delay }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(scale, {
        toValue: 1,
        friction: 3.5,
        tension: 65,
        useNativeDriver: true,
      }).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            Animated.timing(glowAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          ]),
        ).start();
      });
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const borderOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.6],
  });

  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <Animated.View
        style={[
          styles.statBubble,
          {
            borderColor: color,
            borderOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={[bgColor, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          // eslint-disable-next-line react-native/no-inline-styles
          // @ts-ignore
          borderRadius={18}
        />
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const ACHIEVEMENTS = [
  { icon: 'check-circle', color: '#34C759', bg: 'rgba(52,199,89,0.12)', text: 'Primeira aula concluída' },
  { icon: 'zap', color: '#FFD866', bg: 'rgba(255,216,102,0.12)', text: 'Streak iniciado' },
  { icon: 'award', color: '#7456C8', bg: 'rgba(116,86,200,0.12)', text: 'Perfil criado' },
];

export const CelebrationScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}) => {
  const { betcoinsEarned, xpEarned, streak } = useOnboarding();

  // Hero animations
  const emojiScale = useRef(new Animated.Value(0)).current;
  const emojiRotate = useRef(new Animated.Value(-0.15)).current;
  const heroBg = useRef(new Animated.Value(0)).current;

  // Content animations
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(18)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const achieveFade = useRef(new Animated.Value(0)).current;
  const achieveSlide = useRef(new Animated.Value(16)).current;
  const rankingFade = useRef(new Animated.Value(0)).current;
  const rankingSlide = useRef(new Animated.Value(14)).current;
  const buttonSlide = useRef(new Animated.Value(20)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;

  // Emoji float loop
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Emoji entrance
    Animated.sequence([
      Animated.delay(80),
      Animated.parallel([
        Animated.spring(emojiScale, { toValue: 1, friction: 3, tension: 45, useNativeDriver: true }),
        Animated.spring(emojiRotate, { toValue: 0, friction: 5, tension: 55, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // Float after entrance
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -8, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      ).start();
    });

    // Background glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(heroBg, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(heroBg, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    ).start();

    // Title
    Animated.sequence([
      Animated.delay(250),
      Animated.parallel([
        Animated.timing(titleFade, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(titleSlide, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    // Stats
    Animated.sequence([
      Animated.delay(380),
      Animated.timing(statsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Achievements list
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(achieveFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(achieveSlide, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    // Ranking
    Animated.sequence([
      Animated.delay(780),
      Animated.parallel([
        Animated.timing(rankingFade, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(rankingSlide, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    // Button
    Animated.sequence([
      Animated.delay(950),
      Animated.parallel([
        Animated.timing(buttonFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(buttonSlide, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const emojiDeg = emojiRotate.interpolate({
    inputRange: [-0.15, 0],
    outputRange: ['-20deg', '0deg'],
  });

  const glowColor = heroBg.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(116,86,200,0.12)', 'rgba(215,131,216,0.22)'],
  });

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        key: i,
        delay: Math.random() * 600,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        startX: Math.random() * SCREEN_WIDTH,
      })),
    [],
  );

  return (
    <>
      {confettiPieces.map((c) => (
        <ConfettiPiece key={c.key} delay={c.delay} color={c.color} startX={c.startX} />
      ))}

      <OnboardingLayout currentStep={currentStep} totalSteps={totalSteps} onBack={onBack}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* Hero section */}
          <Animated.View style={[styles.heroSection, { backgroundColor: glowColor }]}>
            <Animated.View
              style={{
                transform: [
                  { scale: emojiScale },
                  { rotate: emojiDeg },
                  { translateY: floatAnim },
                ],
              }}
            >
              <Text style={styles.heroEmoji}>🎉</Text>
            </Animated.View>

            <Animated.View
              style={{ opacity: titleFade, transform: [{ translateY: titleSlide }], alignItems: 'center', gap: 6 }}
            >
              <Text style={styles.heroTitle}>Você ganhou!</Text>
              <View style={styles.heroBadge}>
                <Icon name="star" size={12} color="#FFD866" />
                <Text style={styles.heroBadgeText}>Primeira lição concluída</Text>
              </View>
            </Animated.View>
          </Animated.View>

          {/* Stat bubbles */}
          <Animated.View style={[styles.statsRow, { opacity: statsOpacity }]}>
            <StatBubble
              value={`+${betcoinsEarned}`}
              label="Betcoins"
              icon="🪙"
              color="#FFD866"
              bgColor="rgba(255,216,102,0.12)"
              delay={380}
            />
            <StatBubble
              value={`+${xpEarned}`}
              label="XP"
              icon="⚡"
              color="#6366F1"
              bgColor="rgba(99,102,241,0.12)"
              delay={520}
            />
            <StatBubble
              value={`${streak}`}
              label="Streak"
              icon="🔥"
              color="#FF6A56"
              bgColor="rgba(255,106,86,0.12)"
              delay={660}
            />
          </Animated.View>

          {/* Achievements */}
          <Animated.View
            style={[
              styles.achieveCard,
              { opacity: achieveFade, transform: [{ translateY: achieveSlide }] },
            ]}
          >
            <Text style={styles.achieveTitle}>Conquistas desbloqueadas</Text>
            {ACHIEVEMENTS.map((a, i) => (
              <View key={i} style={[styles.achieveItem, i < ACHIEVEMENTS.length - 1 && styles.achieveItemBorder]}>
                <View style={[styles.achieveIcon, { backgroundColor: a.bg }]}>
                  <Icon name={a.icon} size={15} color={a.color} />
                </View>
                <Text style={styles.achieveText}>{a.text}</Text>
                <Icon name="check" size={14} color={a.color} />
              </View>
            ))}
          </Animated.View>

          {/* Ranking card */}
          <Animated.View
            style={[
              styles.rankingCard,
              { opacity: rankingFade, transform: [{ translateY: rankingSlide }] },
            ]}
          >
            <LinearGradient
              colors={['rgba(52,199,89,0.12)', 'rgba(52,199,89,0.04)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.rankingGradient}
            >
              <View style={styles.rankingIconWrapper}>
                <Icon name="trending-up" size={18} color="#34C759" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rankingText}>
                  Você está no <Text style={styles.rankingBold}>4º lugar</Text>
                </Text>
                <Text style={styles.rankingSubtext}>entre novos usuários de hoje</Text>
              </View>
              <Text style={styles.rankingTrophy}>🏆</Text>
            </LinearGradient>
          </Animated.View>
        </ScrollView>

        {/* CTA */}
        <Animated.View
          style={[
            styles.bottomBar,
            { opacity: buttonFade, transform: [{ translateY: buttonSlide }] },
          ]}
        >
          <TouchableOpacity onPress={onNext} activeOpacity={0.9}>
            <LinearGradient
              colors={[...HORIZONTAL_GRADIENT_COLORS]}
              locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>Ver meu plano completo</Text>
              <Icon name="arrow-right" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </OnboardingLayout>
    </>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    gap: 14,
    paddingBottom: 8,
  },

  // Hero
  heroSection: {
    borderRadius: 24,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(215,131,216,0.2)',
    overflow: 'hidden',
  },
  heroEmoji: {
    fontSize: 64,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,216,102,0.15)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,216,102,0.25)',
  },
  heroBadgeText: {
    fontSize: 13,
    color: '#FFD866',
    fontWeight: '600',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBubble: {
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 5,
    overflow: 'hidden',
    backgroundColor: '#16141F',
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: '#8A8595',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Achievements
  achieveCard: {
    backgroundColor: '#16141F',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2B2737',
    overflow: 'hidden',
  },
  achieveTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A8595',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  achieveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  achieveItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2B2737',
  },
  achieveIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achieveText: {
    flex: 1,
    fontSize: 14,
    color: '#C7C3D1',
    fontWeight: '500',
  },

  // Ranking
  rankingCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.25)',
  },
  rankingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rankingIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(52,199,89,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankingText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  rankingSubtext: {
    fontSize: 12,
    color: '#8A8595',
    marginTop: 2,
  },
  rankingBold: {
    fontWeight: '800',
    color: '#34C759',
  },
  rankingTrophy: {
    fontSize: 28,
  },

  // Bottom bar
  bottomBar: {
    paddingBottom: 36,
    paddingTop: 12,
  },
  ctaButton: {
    borderRadius: 999,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

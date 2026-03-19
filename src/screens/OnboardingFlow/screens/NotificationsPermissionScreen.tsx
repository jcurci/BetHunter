import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
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
};

const BENEFITS = [
  { icon: 'clock', color: '#D783D8', text: 'Lembretes diários da sua jornada' },
  { icon: 'alert-circle', color: '#FF6A56', text: 'Alertas anti-recaída em momentos críticos' },
  { icon: 'trending-up', color: '#34C759', text: 'Conquistas e progresso em tempo real' },
];

export const NotificationsPermissionScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  onNext,
}) => {
  const { setPushEnabled } = useOnboarding();
  const bellBounce = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bellBounce, {
          toValue: -12,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bellBounce, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(800),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const handleRequestPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPushEnabled(status === 'granted');
    } catch {
      setPushEnabled(false);
    } finally {
      onNext();
    }
  };

  const handleSkip = () => {
    setPushEnabled(false);
    onNext();
  };

  return (
    <OnboardingLayout currentStep={currentStep} totalSteps={totalSteps}>
      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        {/* Bell icon */}
        <Animated.View style={{ transform: [{ translateY: bellBounce }] }}>
          <LinearGradient
            colors={['rgba(255,216,102,0.2)', 'rgba(255,216,102,0.05)']}
            style={styles.bellContainer}
          >
            <Icon name="bell" size={36} color="#FFD866" />
          </LinearGradient>
        </Animated.View>

        <View style={styles.textGroup}>
          <Text style={styles.title}>Ative as notificações</Text>
          <Text style={styles.subtitle}>
            Não perca nenhum momento da sua recuperação.{'\n'}Receba suporte quando mais precisar.
          </Text>
        </View>

        {/* Benefits list */}
        <View style={styles.benefitsList}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={styles.benefitItem}>
              <View style={[styles.benefitIcon, { backgroundColor: b.color + '22' }]}>
                <Icon name={b.icon} size={16} color={b.color} />
              </View>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsGroup}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleRequestPermission}
            style={{ width: '100%' }}
          >
            <LinearGradient
              colors={[...HORIZONTAL_GRADIENT_COLORS]}
              locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Icon name="bell" size={16} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Ativar notificações</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipButton}>
            <Text style={styles.skipText}>Agora não</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  bellContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,216,102,0.25)',
  },
  textGroup: {
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: '#A09BAE',
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsList: {
    width: '100%',
    backgroundColor: '#16141F',
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2B2737',
    overflow: 'hidden',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#C7C3D1',
    flex: 1,
    lineHeight: 20,
  },
  buttonsGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#6E6A78',
    textAlign: 'center',
  },
});

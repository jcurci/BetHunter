import React, { useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import Icon from 'react-native-vector-icons/Feather';
import { useOnboarding } from '../OnboardingContext';
import { HORIZONTAL_GRADIENT_COLORS, HORIZONTAL_GRADIENT_LOCATIONS } from '../../../config/colors';

type Props = {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
};

export const NotificationsPermissionScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  onNext,
}) => {
  const { setPushEnabled } = useOnboarding();
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -10,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [translateY]);

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

  const progress = (currentStep + 1) / totalSteps;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.progressBarBackground}>
          <LinearGradient colors={[...HORIZONTAL_GRADIENT_COLORS]} locations={[...HORIZONTAL_GRADIENT_LOCATIONS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: progress, borderRadius: 999 }} />
          <View style={{ flex: 1 - progress }} />
        </View>

        <View style={styles.content}>
          <Animated.View style={[styles.bellContainer, { transform: [{ translateY }] }]}>
            <Icon name="bell" size={40} color="#FFD866" />
          </Animated.View>

          <Text style={styles.title}>Ative as notificações</Text>
          <Text style={styles.subtitle}>
            Receba lembretes da sua jornada e alertas anti-recaída.
          </Text>

          <TouchableOpacity activeOpacity={0.9} onPress={handleRequestPermission} style={{ width: '100%', marginBottom: 12 }}>
            <LinearGradient colors={[...HORIZONTAL_GRADIENT_COLORS]} locations={[...HORIZONTAL_GRADIENT_LOCATIONS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Ativar agora</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.secondaryLinkText}>Não me perturbe por enquanto</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#2A2435',
    marginBottom: 32,
  },
  progressBarFill: {
    backgroundColor: '#D783D8',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#24172F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#C7C3D1',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  primaryButton: {
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryLinkText: {
    fontSize: 14,
    color: '#8A8595',
    textAlign: 'center',
  },
});


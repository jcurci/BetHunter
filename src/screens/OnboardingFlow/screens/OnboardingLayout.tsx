import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import RadialGradientBackground from '../../../components/common/RadialGradientBackground/RadialGradientBackground';
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
} from '../../../config/colors';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  stepLabel?: string;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  currentStep,
  totalSteps,
  onBack,
  stepLabel,
}) => {
  const rawProgress = (currentStep + 1) / totalSteps;
  const progress = Math.max(0.01, Math.min(rawProgress, 1));

  // Screen entrance animation
  const entranceFade = useRef(new Animated.Value(0)).current;
  const entranceSlide = useRef(new Animated.Value(20)).current;

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance: fade + slide up
    Animated.parallel([
      Animated.timing(entranceFade, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(entranceSlide, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar fill animation
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      delay: 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  const progressFlex = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.01, 1],
  });

  const remainFlex = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.99, 0],
  });

  return (
    <RadialGradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: entranceFade,
              transform: [{ translateY: entranceSlide }],
            },
          ]}
        >
          {/* Progress bar */}
          <View style={styles.progressBarBackground}>
            <Animated.View style={{ flex: progressFlex }}>
              <LinearGradient
                colors={[...HORIZONTAL_GRADIENT_COLORS]}
                locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressFill}
              />
            </Animated.View>
            <Animated.View style={{ flex: remainFlex }} />
          </View>

          {/* Header */}
          {(onBack !== undefined || stepLabel) && (
            <View style={styles.headerRow}>
              {onBack ? (
                <TouchableOpacity
                  onPress={onBack}
                  activeOpacity={0.7}
                  style={styles.backButton}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.backText}>← Voltar</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              {stepLabel ? (
                <View style={styles.stepBadge}>
                  <Text style={styles.stepIndicator}>{stepLabel}</Text>
                </View>
              ) : (
                <View />
              )}
            </View>
          )}

          {children}
        </Animated.View>
      </SafeAreaView>
    </RadialGradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  progressBarBackground: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#2A2435',
    marginBottom: 20,
  },
  progressFill: {
    flex: 1,
    height: 5,
    borderRadius: 999,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 4,
  },
  backText: {
    color: '#C7C3D1',
    fontSize: 15,
    fontWeight: '500',
  },
  stepBadge: {
    backgroundColor: 'rgba(116,86,200,0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(116,86,200,0.3)',
  },
  stepIndicator: {
    color: '#B8A8E8',
    fontSize: 12,
    fontWeight: '600',
  },
});

import React, { useEffect, useRef } from 'react';
import {
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
} from '../../../config/colors';

interface QuizContinueButtonProps {
  enabled: boolean;
  onPress: () => void;
  label?: string;
}

export const QuizContinueButton: React.FC<QuizContinueButtonProps> = ({
  enabled,
  onPress,
  label = 'Continuar',
}) => {
  const enabledAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (enabled) {
      // Slide up into view
      Animated.spring(enabledAnim, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }).start();

      // Start pulsing glow
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      pulseAnim.setValue(1);
      Animated.timing(enabledAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      pulseRef.current?.stop();
    };
  }, [enabled]);

  const handlePress = () => {
    if (!enabled) return;
    // Navega imediatamente — animação roda em paralelo sem bloquear
    onPress();
    Animated.sequence([
      Animated.timing(pressScale, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(pressScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const opacity = enabledAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const translateY = enabledAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity,
          transform: [
            { scale: enabled ? pulseAnim : pressScale },
            { translateY },
          ],
        },
      ]}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={1} disabled={!enabled}>
        <LinearGradient
          colors={[...HORIZONTAL_GRADIENT_COLORS]}
          locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  button: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

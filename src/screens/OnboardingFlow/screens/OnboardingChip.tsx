import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from 'react-native';
import { quizStyles } from './quizStyles';

export interface OnboardingChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  /** Posição no stagger de entrada. */
  index?: number;
  /** Delay base do stagger, em ms. */
  groupOffset?: number;
  /** Ícone opcional à esquerda do rótulo. */
  icon?: React.ReactNode;
  /** Padding menor e peso 600 no selecionado — usado na grade de origem. */
  compact?: boolean;
  pressScaleTo?: number;
}

export const OnboardingChip: React.FC<OnboardingChipProps> = ({
  label,
  isSelected,
  onPress,
  index = 0,
  groupOffset = 0,
  icon,
  compact = false,
  pressScaleTo = 0.92,
}) => {
  const mountFade = useRef(new Animated.Value(0)).current;
  const mountScale = useRef(new Animated.Value(0.85)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const selectedAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = groupOffset + index * 60;
    Animated.parallel([
      Animated.timing(mountFade, {
        toValue: 1,
        duration: 280,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(mountScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.spring(selectedAnim, {
      toValue: isSelected ? 1 : 0,
      friction: 5,
      tension: 80,
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressScale, { toValue: pressScaleTo, duration: 70, useNativeDriver: true }),
      Animated.spring(pressScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  // Cor precisa de useNativeDriver: false, por isso a interpolação fica na
  // Animated.View interna e não no wrapper de transform.
  const borderColor = selectedAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#2B2737', '#D783D8'],
  });

  const backgroundColor = selectedAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1E1B2A', 'rgba(215,131,216,0.15)'],
  });

  const textSelectedStyle = compact
    ? quizStyles.chipTextSelectedCompact
    : quizStyles.chipTextSelected;

  return (
    <Animated.View
      style={{
        opacity: mountFade,
        transform: [{ scale: mountScale }, { scale: pressScale }],
      }}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={1}>
        <Animated.View
          style={[
            styles.chip,
            compact && quizStyles.chipCompact,
            { borderColor, backgroundColor },
          ]}
        >
          <View style={quizStyles.chipContent}>
            {icon}
            <Text style={[quizStyles.chipText, isSelected && textSelectedStyle]}>
              {label}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1.5,
  },
});

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { quizStyles } from './quizStyles';

interface AnimatedQuizCardProps {
  question: string;
  options: string[];
  selected: string | null;
  onSelect: (opt: string) => void;
}

interface AnimatedOptionProps {
  option: string;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}

const AnimatedOption: React.FC<AnimatedOptionProps> = ({
  option,
  isSelected,
  onPress,
  index,
}) => {
  const mountFade = useRef(new Animated.Value(0)).current;
  const mountSlide = useRef(new Animated.Value(18)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const radioScale = useRef(new Animated.Value(0)).current;
  const selectedBg = useRef(new Animated.Value(0)).current;

  // Mount stagger
  useEffect(() => {
    const delay = 80 + index * 55;
    Animated.parallel([
      Animated.timing(mountFade, {
        toValue: 1,
        duration: 320,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(mountSlide, {
        toValue: 0,
        duration: 320,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Radio button spring animation
  useEffect(() => {
    Animated.spring(radioScale, {
      toValue: isSelected ? 1 : 0,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();

    Animated.timing(selectedBg, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressScale, {
        toValue: 0.96,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(pressScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  const borderColor = selectedBg.interpolate({
    inputRange: [0, 1],
    outputRange: ['#2B2737', '#D783D8'],
  });

  const backgroundColor = selectedBg.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1E1B2A', 'rgba(215,131,216,0.12)'],
  });

  return (
    <Animated.View
      style={{
        opacity: mountFade,
        transform: [{ translateY: mountSlide }, { scale: pressScale }],
        marginBottom: 10,
      }}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={1}>
        <Animated.View
          style={[
            styles.option,
            { borderColor, backgroundColor },
          ]}
        >
          {/* Radio */}
          <View style={[quizStyles.radio, isSelected && quizStyles.radioSelected]}>
            <Animated.View
              style={[
                quizStyles.radioInnerDot,
                {
                  transform: [{ scale: radioScale }],
                  opacity: radioScale,
                },
              ]}
            />
          </View>

          <Text style={[quizStyles.optionText, isSelected && quizStyles.optionTextSelected]}>
            {option}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const AnimatedQuizCard: React.FC<AnimatedQuizCardProps> = ({
  question,
  options,
  selected,
  onSelect,
}) => {
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(24)).current;
  const questionFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(questionFade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  return (
    <Animated.View
      style={[
        quizStyles.card,
        {
          opacity: cardFade,
          transform: [{ translateY: cardSlide }],
        },
      ]}
    >
      <Animated.Text style={[quizStyles.question, { opacity: questionFade }]}>
        {question}
      </Animated.Text>

      {options.map((opt, i) => (
        <AnimatedOption
          key={opt}
          option={opt}
          isSelected={selected === opt}
          onPress={() => onSelect(opt)}
          index={i}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
});

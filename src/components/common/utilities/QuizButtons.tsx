import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface QuizActionButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const QuizActionButton: React.FC<QuizActionButtonProps> = ({ label, onPress, disabled, style, textStyle }) => {
  const outerColors = disabled
    ? ["rgba(255,255,255,0.12)", "rgba(9,9,14,0.8)"]
    : ["rgba(255,255,255,0.28)", "rgba(25,25,35,0.85)"];

  const innerGradient = disabled
    ? ["#13121A", "#0E0D14"]
    : ["#1B1724", "#13111C"];

  return (
    <LinearGradient
      colors={outerColors}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.outer, style]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={disabled}
        style={styles.touchable}
      >
        <LinearGradient
          colors={innerGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.inner}
        >
          <Text style={[styles.label, disabled && styles.labelDisabled, textStyle]}>
            {label}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default QuizActionButton;

export const QuizDisabledButton: React.FC<Omit<QuizActionButtonProps, "disabled">> = (props) => (
  <QuizActionButton {...props} disabled />
);

export const QuizPrimaryButton: React.FC<QuizActionButtonProps> = (props) => (
  <QuizActionButton {...props} />
);

const styles = StyleSheet.create({
  outer: {
    borderRadius: 28,
    padding: 1,
    overflow: "hidden",
  },
  touchable: {
    borderRadius: 27,
    overflow: "hidden",
  },
  inner: {
    borderRadius: 27,
    paddingVertical: 16,
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  labelDisabled: {
    color: "rgba(255,255,255,0.45)",
  },
});

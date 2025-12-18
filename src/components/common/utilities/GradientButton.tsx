import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface GradientButtonProps {
  onPress?: () => void;
  title: string;
  gradientColors?: readonly [string, string, ...string[]];
  containerStyle?: ViewStyle;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const GradientButton: React.FC<GradientButtonProps> = ({
  onPress,
  title,
  gradientColors = ["rgba(255,255,255,0.35)", "rgba(255,255,255,0.05)", "rgba(0,0,0,0.2)"] as const,
  containerStyle,
  buttonStyle,
  textStyle,
  disabled = false,
}) => {
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[styles.gradient, containerStyle, disabled && styles.disabledGradient]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.button, buttonStyle]}
        disabled={disabled}
      >
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 25,
    padding: 3,
  },
  button: {
    backgroundColor: "rgba(19, 18, 30, 0.85)",
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledGradient: {
    opacity: 0.5,
  },
});

export default GradientButton;


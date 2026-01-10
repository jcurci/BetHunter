import React, { ReactNode } from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface GradientButtonProps {
  onPress?: () => void;
  title: string;
  gradientColors?: readonly [string, string, ...string[]];
  containerStyle?: ViewStyle;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  icon?: ReactNode;
}

const GradientButton: React.FC<GradientButtonProps> = ({
  onPress,
  title,
  gradientColors = ["rgba(255,255,255,0.35)", "rgba(255,255,255,0.05)", "rgba(0,0,0,0.2)"] as const,
  containerStyle,
  buttonStyle,
  textStyle,
  disabled = false,
  icon,
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
        <View style={styles.content}>
          <Text style={[styles.text, textStyle]}>{title}</Text>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
        </View>
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
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  iconContainer: {
    marginLeft: 4,
  },
  disabledGradient: {
    opacity: 0.5,
  },
});

export default GradientButton;


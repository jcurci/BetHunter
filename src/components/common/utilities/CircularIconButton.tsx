import React from "react";
import { TouchableOpacity, View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface CircularIconButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  size?: number;
  gradientColors?: string[];
  containerStyle?: ViewStyle;
}

const CircularIconButton: React.FC<CircularIconButtonProps> = ({
  onPress,
  children,
  size = 42,
  gradientColors = ["rgba(255,255,255,0.35)", "rgba(255,255,255,0.05)", "rgba(0,0,0,0.2)"],
  containerStyle,
}) => {
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[styles.outerRing, { width: size, height: size, borderRadius: size / 2 }, containerStyle]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.innerButton, { width: size - 6, height: size - 6, borderRadius: (size - 6) / 2 }]}
      >
        <View style={styles.iconWrapper}>{children}</View>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  outerRing: {
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  innerButton: {
    backgroundColor: "rgba(19, 18, 30, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CircularIconButton;

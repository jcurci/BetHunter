import React from "react";
import { TouchableOpacity, View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  BUTTON_BORDER_GRADIENT_COLORS,
  BUTTON_BORDER_GRADIENT_LOCATIONS,
  BUTTON_BORDER_GRADIENT,
  BUTTON_HIGHLIGHT_COLORS,
  BUTTON_INNER_BACKGROUND,
  BUTTON_INNER_BORDER_COLOR,
} from "../../../config/colors";

interface CircularIconButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  size?: number;
  gradientColors?: readonly [string, string, ...string[]];
  containerStyle?: ViewStyle;
}

const CircularIconButton: React.FC<CircularIconButtonProps> = ({
  onPress,
  children,
  size = 42,
  gradientColors = BUTTON_BORDER_GRADIENT_COLORS,
  containerStyle,
}) => {
  return (
    <View style={[styles.wrapper, { width: size, height: size, borderRadius: size / 2 }, containerStyle]}>
    <LinearGradient
      colors={gradientColors}
        locations={BUTTON_BORDER_GRADIENT_LOCATIONS}
        start={BUTTON_BORDER_GRADIENT.start}
        end={BUTTON_BORDER_GRADIENT.end}
        style={[styles.outerRing, { width: size, height: size, borderRadius: size / 2 }]}
      >
        {/* Highlight no topo */}
        <LinearGradient
          colors={BUTTON_HIGHLIGHT_COLORS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.highlight, { borderRadius: size / 2 }]}
          pointerEvents="none"
        />
        
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
          style={[styles.innerButton, { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }]}
      >
        <View style={styles.iconWrapper}>{children}</View>
      </TouchableOpacity>
    </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
  },
  outerRing: {
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
    opacity: 0.9,
  },
  innerButton: {
    backgroundColor: BUTTON_INNER_BACKGROUND,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BUTTON_INNER_BORDER_COLOR,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CircularIconButton;

import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  BUTTON_BORDER_GRADIENT_COLORS,
  BUTTON_BORDER_GRADIENT_LOCATIONS,
  BUTTON_BORDER_GRADIENT,
  BUTTON_HIGHLIGHT_COLORS,
  BUTTON_INNER_BACKGROUND,
  BUTTON_INNER_BORDER_COLOR,
} from "../../../config/colors";

interface MenuSectionProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const MenuSection: React.FC<MenuSectionProps> = ({ children, style }) => {
  return (
    <View style={[styles.wrapper, style]}>
      <LinearGradient
        colors={BUTTON_BORDER_GRADIENT_COLORS}
        locations={BUTTON_BORDER_GRADIENT_LOCATIONS}
        start={BUTTON_BORDER_GRADIENT.start}
        end={BUTTON_BORDER_GRADIENT.end}
        style={styles.gradientBorder}
      >
        {/* Highlight no topo */}
        <LinearGradient
          colors={BUTTON_HIGHLIGHT_COLORS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.highlight}
          pointerEvents="none"
        />
        
        <View style={styles.innerContainer}>{children}</View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
    borderRadius: 16,
    marginBottom: 12,
  },
  gradientBorder: {
    borderRadius: 16,
    padding: 1,
  },
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
    borderRadius: 16,
    opacity: 0.9,
  },
  innerContainer: {
    backgroundColor: BUTTON_INNER_BACKGROUND,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: BUTTON_INNER_BORDER_COLOR,
    overflow: "hidden",
  },
});

export default MenuSection;


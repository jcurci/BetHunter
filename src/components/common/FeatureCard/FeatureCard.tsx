import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  BUTTON_BORDER_GRADIENT_COLORS,
  BUTTON_BORDER_GRADIENT_LOCATIONS,
  BUTTON_BORDER_GRADIENT,
  BUTTON_HIGHLIGHT_COLORS,
  BUTTON_INNER_BACKGROUND,
  BUTTON_INNER_BORDER_COLOR,
} from "../../../config/colors";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
  style?: ViewStyle;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  style,
}) => {
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
        
        <TouchableOpacity
          style={styles.innerCard}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>{icon}</View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 16,
  },
  gradientBorder: {
    borderRadius: 16,
    padding: 1,
    minHeight: 120,
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
  innerCard: {
    flex: 1,
    backgroundColor: BUTTON_INNER_BACKGROUND,
    borderRadius: 15,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BUTTON_INNER_BORDER_COLOR,
    minHeight: 118,
  },
  iconContainer: {
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: "#A09CAB",
    textAlign: "center",
  },
});

export default FeatureCard;


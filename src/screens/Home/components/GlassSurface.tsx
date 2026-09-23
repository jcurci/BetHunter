import React from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import {
  BRAND_GRADIENT_COLORS,
  BRAND_GRADIENT_LOCATIONS,
  GLASS_BORDER_COLORS,
  GLASS_BORDER_LOCATIONS,
  GLASS_FILL_COLORS,
  GLASS_HIGHLIGHT_COLORS,
  GLASS_SHADOW,
} from "../../../config/colors";

interface GlassSurfaceProps {
  radius: number;
  /** "brand" troca a borda de vidro pelo anel em gradiente da marca. */
  variant?: "glass" | "brand";
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Superfície "liquid glass" da Home.
 *
 * Camadas, de baixo para cima: borda (gradiente claro→transparente, a luz
 * entrando pelo topo), preenchimento escuro translúcido, reflexo difuso no
 * terço superior e o conteúdo. A sombra só existe no iOS: a `elevation` do
 * Android vaza por superfícies translúcidas e escurece o vidro.
 */
const GlassSurface: React.FC<GlassSurfaceProps> = ({
  radius,
  variant = "glass",
  borderWidth = variant === "brand" ? 1.5 : 1,
  style,
  contentStyle,
  children,
}) => {
  const innerRadius = Math.max(radius - borderWidth, 0);
  const isBrand = variant === "brand";
  const inset = {
    top: borderWidth,
    left: borderWidth,
    right: borderWidth,
    bottom: borderWidth,
    borderRadius: innerRadius,
  };

  return (
    <View style={[{ borderRadius: radius }, Platform.OS === "ios" && GLASS_SHADOW, style]}>
      <LinearGradient
        colors={isBrand ? BRAND_GRADIENT_COLORS : GLASS_BORDER_COLORS}
        locations={isBrand ? BRAND_GRADIENT_LOCATIONS : GLASS_BORDER_LOCATIONS}
        start={isBrand ? { x: 0, y: 0.2 } : { x: 0.5, y: 0 }}
        end={isBrand ? { x: 1, y: 0.8 } : { x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <LinearGradient
        colors={GLASS_FILL_COLORS}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.inset, inset]}
      />
      <LinearGradient
        colors={GLASS_HIGHLIGHT_COLORS}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
        style={[styles.inset, inset]}
        pointerEvents="none"
      />
      <View style={[styles.content, { margin: borderWidth, borderRadius: innerRadius }, contentStyle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inset: {
    position: "absolute",
  },
  content: {
    flex: 1,
  },
});

export default GlassSurface;

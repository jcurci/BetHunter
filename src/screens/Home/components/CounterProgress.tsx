import React from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { BRAND_GRADIENT_COLORS, BRAND_GRADIENT_LOCATIONS } from "../../../config/colors";
import Glow from "./Glow";

interface CounterProgressProps {
  /** 0 → 1, dirigido pelo HomeCounter (driver nativo). */
  progress: Animated.Value;
  width: number;
  height: number;
}

/**
 * Barra do ciclo do contador.
 *
 * O preenchimento é a barra inteira comprimida com `scaleX` a partir da borda
 * esquerda (a `translateX` compensa a origem central do transform). Assim roda
 * no driver nativo e o gradiente completo cabe no trecho preenchido, como na
 * referência — em vez de uma barra de formulário que "revela" a cor.
 */
const CounterProgress: React.FC<CounterProgressProps> = ({ progress, width, height }) => {
  const radius = height / 2;
  const glowHeight = height * 5;

  return (
    <View style={{ width, height }}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          { top: (height - glowHeight) / 2, left: -width * 0.1, opacity: progress },
        ]}
      >
        <Glow width={width * 1.2} height={glowHeight} color="#DE57DF" intensity={0.35} />
      </Animated.View>
      <View style={[styles.track, { borderRadius: radius }]} />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-width / 2, 0],
                }),
              },
              { scaleX: progress.interpolate({ inputRange: [0, 1], outputRange: [0.0001, 1] }) },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={BRAND_GRADIENT_COLORS}
          locations={BRAND_GRADIENT_LOCATIONS}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }, Platform.OS === "ios" && styles.iosGlow]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  glow: {
    position: "absolute",
  },
  track: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,6,12,0.55)",
  },
  iosGlow: {
    shadowColor: "#DE57DF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
  },
});

export default CounterProgress;

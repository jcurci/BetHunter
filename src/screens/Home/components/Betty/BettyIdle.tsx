import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg from "react-native-svg";

import {
  BETTY_VIEWBOX_HEIGHT,
  BETTY_VIEWBOX_WIDTH,
  BodyLayer,
  ClosedEyesLayer,
  FaceLayer,
  HairLayer,
  LegsLayer,
  OpenEyesLayer,
  ShadowLayer,
  StaticLayer,
} from "./bettyShapes";

/**
 * Betty em idle — reprodução do loop de `refatora-home/bettyIdle.svg`.
 *
 * O arquivo original anima via CSS `@keyframes`, que o react-native-svg não
 * executa. Aqui cada grupo animado do SVG vira uma camada própria (mesmo
 * viewBox, empilhadas na ordem original) e os keyframes viram interpolações de
 * um único `Animated.Value` no driver nativo: nenhum re-render durante o loop.
 */

/** Duração do ciclo definida no SVG (`animation: … 3.8s linear infinite`). */
const LOOP_MS = 3800;
/** Deslocamento do "respiro", em unidades do viewBox (`translateY(-15.973px)`). */
const BOB_UNITS = 15.973;
/** Fim da volta ao repouso em todos os grupos (`84.34%`). */
const BOB_END = 0.8434;

// Curvas CSS: ease-in e ease-out.
const easeIn = Easing.bezier(0.42, 0, 1, 1);
const easeOut = Easing.bezier(0, 0, 0.58, 1);

/**
 * Amostra um keyframe com easing em pontos para a interpolação linear do
 * Animated — é assim que a curva do CSS sobrevive no driver nativo.
 */
const SAMPLES = 10;
function bobKeyframes(peak: number, amplitude: number) {
  const input: number[] = [];
  const output: number[] = [];
  const push = (x: number, y: number) => {
    if (input.length && x <= input[input.length - 1]) return;
    input.push(x);
    output.push(y);
  };
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    push(peak * t, -amplitude * easeIn(t));
  }
  for (let i = 1; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    push(peak + (BOB_END - peak) * t, -amplitude * (1 - easeOut(t)));
  }
  push(1, 0);
  return { inputRange: input, outputRange: output };
}

// Piscar: 94% → 95% troca os olhos, 99% → 100% volta.
const BLINK_INPUT = [0, 0.94, 0.95, 0.99, 1];
const OPEN_EYES_OPACITY = [1, 1, 0, 0, 1];
const CLOSED_EYES_OPACITY = [0, 0, 1, 1, 0];

interface BettyIdleProps {
  /** Altura renderizada; a largura sai da proporção do viewBox. */
  height: number;
}

const BettyIdle: React.FC<BettyIdleProps> = ({ height }) => {
  const width = (height * BETTY_VIEWBOX_WIDTH) / BETTY_VIEWBOX_HEIGHT;
  const unit = height / BETTY_VIEWBOX_HEIGHT;
  const clock = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(clock, {
        toValue: 1,
        duration: LOOP_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [clock]);

  const bob = (peak: number) => ({
    transform: [{ translateY: clock.interpolate(bobKeyframes(peak, BOB_UNITS * unit)) }],
  });

  const layer = (content: React.ReactElement) => (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${BETTY_VIEWBOX_WIDTH} ${BETTY_VIEWBOX_HEIGHT}`}
      style={StyleSheet.absoluteFill}
    >
      {content}
    </Svg>
  );

  return (
    <View
      style={{ width, height }}
      pointerEvents="none"
      accessibilityRole="image"
      accessibilityLabel="Betty, sua companheira no BetHunter"
    >
      {layer(ShadowLayer)}
      <Animated.View style={[StyleSheet.absoluteFill, bob(0.475)]}>{layer(LegsLayer)}</Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, bob(0.3909)]}>{layer(BodyLayer)}</Animated.View>
      {layer(StaticLayer)}
      <Animated.View style={[StyleSheet.absoluteFill, bob(0.4796)]}>
        {layer(FaceLayer)}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: clock.interpolate({ inputRange: BLINK_INPUT, outputRange: CLOSED_EYES_OPACITY }) },
          ]}
        >
          {layer(ClosedEyesLayer)}
        </Animated.View>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: clock.interpolate({ inputRange: BLINK_INPUT, outputRange: OPEN_EYES_OPACITY }) },
          ]}
        >
          {layer(OpenEyesLayer)}
        </Animated.View>
        {layer(HairLayer)}
      </Animated.View>
    </View>
  );
};

export default React.memo(BettyIdle);

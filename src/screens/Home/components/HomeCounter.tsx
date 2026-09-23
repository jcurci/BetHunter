import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import BetStreakCounter from "../BetStreakCounter";
import CounterProgress from "./CounterProgress";
import GradientText from "./GradientText";
import Glow from "./Glow";
import { HOME_FONTS, HomeLayout } from "./homeLayout";
import { formatSavings } from "./useHomeSavings";

/**
 * Ciclo do contador — ajuste aqui, a lógica não muda.
 * HOLD: tempo com um indicador parado enquanto a barra enche.
 * TRANSITION: troca de um indicador para o outro.
 */
export const COUNTER_HOLD_MS = 6000;
export const COUNTER_TRANSITION_MS = 850;
/** Quanto o conteúdo sobe/desce na troca, em dp (antes da escala). */
const FLOW_DISTANCE = 16;

interface HomeCounterProps {
  layout: HomeLayout;
  days: number;
  daysReady: boolean;
  onDaysPress: () => void;
  /** null → skeleton no estado B. */
  savingsAmount: number | null;
  /** null → atalho de compartilhar escondido (contador ainda não carregou). */
  onSharePress: (() => void) | null;
  shareIsNew: boolean;
  /** Pulso do atalho enquanto ele é novidade (0 ↔ 1, dirigido pela Home). */
  sharePulse: Animated.Value;
}

/**
 * Área central: alterna "livre de apostas por" ↔ "já economizou".
 *
 * Os dois estados ficam montados e empilhados numa caixa de altura fixa (sem
 * layout shift). Um único valor `flow` cresce 0 → 1 → 2 → …; com `modulo 2` o
 * conteúdo sempre sai subindo e o próximo sempre entra por baixo, então a
 * sensação é de fluxo contínuo e não de vai-e-volta. Tudo no driver nativo —
 * o único setState por ciclo é o que diz qual estado recebe toques.
 */
const HomeCounter: React.FC<HomeCounterProps> = ({
  layout,
  days,
  daysReady,
  onDaysPress,
  savingsAmount,
  onSharePress,
  shareIsNew,
  sharePulse,
}) => {
  const { s, v, contentWidth } = layout;
  const flow = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [active, setActive] = useState<0 | 1>(0);

  useEffect(() => {
    let step = 0;
    let running: Animated.CompositeAnimation | null = null;
    let cancelled = false;

    const cycle = () => {
      progress.setValue(0);
      running = Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: COUNTER_HOLD_MS,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(flow, {
            toValue: step + 1,
            duration: COUNTER_TRANSITION_MS,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          // A barra fica cheia enquanto o conteúdo sai e recolhe quando o próximo assenta.
          Animated.sequence([
            Animated.delay(COUNTER_TRANSITION_MS * 0.4),
            Animated.timing(progress, {
              toValue: 0,
              duration: COUNTER_TRANSITION_MS * 0.6,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
      running.start(({ finished }) => {
        if (!finished || cancelled) return;
        step += 1;
        setActive((step % 2) as 0 | 1);
        cycle();
      });
    };

    cycle();
    return () => {
      cancelled = true;
      running?.stop();
    };
  }, [flow, progress]);

  const d = s(FLOW_DISTANCE);
  // Memoizado: recriar os nós a cada render reconectaria o grafo nativo no meio da animação.
  const { stateAStyle, stateBStyle } = useMemo(() => {
    const phase = Animated.modulo(flow, 2);
    return {
      // Estado A: visível em 0, sai subindo até 1, volta por baixo entre 1 e 2.
      stateAStyle: {
        opacity: phase.interpolate({ inputRange: [0, 0.55, 1.45, 2], outputRange: [1, 0, 0, 1] }),
        transform: [
          { translateY: phase.interpolate({ inputRange: [0, 0.999, 1.001, 2], outputRange: [0, -d, d, 0] }) },
          { scale: phase.interpolate({ inputRange: [0, 0.999, 1.001, 2], outputRange: [1, 0.94, 1.06, 1] }) },
        ],
      },
      // Estado B: entra por baixo entre 0 e 1, sai subindo entre 1 e 2.
      stateBStyle: {
        opacity: phase.interpolate({ inputRange: [0, 0.45, 1, 1.55, 2], outputRange: [0, 0, 1, 0, 0] }),
        transform: [
          { translateY: phase.interpolate({ inputRange: [0, 1, 2], outputRange: [d, 0, -d] }) },
          { scale: phase.interpolate({ inputRange: [0, 1, 2], outputRange: [1.06, 1, 0.94] }) },
        ],
      },
    };
  }, [flow, d]);

  const labelFontSize = s(15);
  const baseValueSize = s(58);
  const savingsText = savingsAmount === null ? null : formatSavings(savingsAmount);
  // Valores longos encolhem para caber na largura (Inter Tight Extra Bold ≈ 0,5 em/caractere).
  const savingsFontSize = savingsText
    ? Math.min(baseValueSize, Math.floor((contentWidth - s(44)) / (savingsText.length * 0.5)))
    : baseValueSize;
  const boxHeight = Math.round(labelFontSize * 1.2) + Math.round(baseValueSize * 1.08);

  const share = onSharePress ? (
    <Animated.View
      style={{
        marginLeft: s(10),
        transform: [{ scale: sharePulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
      }}
    >
      <TouchableOpacity
        onPress={onSharePress}
        hitSlop={12}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={
          shareIsNew ? "Novidade: compartilhar seus dias sem apostar" : "Compartilhar seus dias sem apostar"
        }
      >
        <MaterialCommunityIcons name="tray-arrow-up" size={s(22)} color="#FF5A3F" />
        {/* Substitui o selo "NOVO": some no primeiro toque (ver openShareCardModal). */}
        {shareIsNew && <View style={[styles.newDot, { width: s(7), height: s(7), borderRadius: s(4) }]} />}
      </TouchableOpacity>
    </Animated.View>
  ) : null;

  const savingsValueStyle = [
    styles.value,
    {
      fontSize: savingsFontSize,
      lineHeight: Math.round(savingsFontSize * 1.08),
      letterSpacing: -savingsFontSize * 0.045,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={{ height: boxHeight, width: contentWidth }}>
        <Animated.View
          style={[styles.state, stateAStyle]}
          pointerEvents={active === 0 ? "box-none" : "none"}
          accessibilityElementsHidden={active !== 0}
          importantForAccessibility={active === 0 ? "auto" : "no-hide-descendants"}
        >
          <BetStreakCounter
            days={days}
            statsReady={daysReady}
            onPress={onDaysPress}
            valueFontSize={baseValueSize}
            labelFontSize={labelFontSize}
            accessory={share}
          />
        </Animated.View>

        <Animated.View
          style={[styles.state, stateBStyle]}
          pointerEvents={active === 1 ? "box-none" : "none"}
          accessibilityElementsHidden={active !== 1}
          importantForAccessibility={active === 1 ? "auto" : "no-hide-descendants"}
        >
          <Text style={[styles.label, { fontSize: labelFontSize, lineHeight: Math.round(labelFontSize * 1.2) }]}>
            Você já economizou:
          </Text>
          <View style={[styles.valueRow, { height: Math.round(baseValueSize * 1.08) }]}>
            {savingsText === null ? (
              <View style={[styles.placeholder, { width: baseValueSize * 4, height: baseValueSize }]} />
            ) : (
              <View accessible accessibilityLabel={`Você já economizou ${savingsText} reais`}>
                <View style={styles.glowWrap} pointerEvents="none">
                  <Glow width={savingsFontSize * 6} height={savingsFontSize * 2} color="#B84FD8" intensity={0.32} />
                </View>
                <GradientText>
                  <Text style={savingsValueStyle}>{savingsText}</Text>
                </GradientText>
              </View>
            )}
            {share}
          </View>
        </Animated.View>
      </View>

      <View style={{ marginTop: v(10) }}>
        <CounterProgress progress={progress} width={s(89)} height={s(6)} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  state: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
  },
  label: {
    color: "rgba(255,255,255,0.86)",
    fontFamily: HOME_FONTS.regular,
    textAlign: "center",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontFamily: HOME_FONTS.heavy,
    includeFontPadding: false,
  },
  glowWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  newDot: {
    position: "absolute",
    top: -2,
    right: -3,
    backgroundColor: "#FFFFFF",
  },
});

export default HomeCounter;

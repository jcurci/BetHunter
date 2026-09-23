import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import GradientText from "./components/GradientText";
import Glow from "./components/Glow";
import { HOME_FONTS } from "./components/homeLayout";

/**
 * O contador de dias livre de apostas da Home (estado A do HomeCounter).
 *
 * Mostra **só `days`**, exatamente como veio de `GET /users/bet-streak`. Não
 * soma um dia, não arredonda para cima e não deduz nada de virada de data — o
 * backend calcula a duração a partir de `bet_free_since_at` e este componente
 * apenas desenha o número. Horas e minutos existem no mesmo objeto, mas são
 * assunto do card de compartilhamento.
 *
 * Enquanto `statsReady` for false, desenha o skeleton em vez de um "0": um
 * carregamento (ou uma consulta que falhou) não pode ser lido como zero dia.
 */
export interface BetStreakCounterProps {
  days: number;
  /** Dados carregados. False → skeleton, nunca "0". */
  statsReady: boolean;
  /** Caminho de "Apostei": abre a confirmação de reset. */
  onPress: () => void;
  /** Tamanho do número; o rótulo acompanha. */
  valueFontSize?: number;
  labelFontSize?: number;
  /** Elemento à direita do número (o atalho de compartilhar), fora do toque de reset. */
  accessory?: React.ReactNode;
}

const BetStreakCounter: React.FC<BetStreakCounterProps> = ({
  days,
  statsReady,
  onPress,
  valueFontSize = 58,
  labelFontSize = 15,
  accessory,
}) => {
  const valueStyle = [
    styles.value,
    {
      fontSize: valueFontSize,
      lineHeight: Math.round(valueFontSize * 1.08),
      letterSpacing: -valueFontSize * 0.045,
    },
  ];
  const unit = days === 1 ? " dia" : " dias";

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { fontSize: labelFontSize, lineHeight: Math.round(labelFontSize * 1.2) }]}>
        Você está livre de apostas por:
      </Text>
      <View style={styles.valueRow}>
        <TouchableOpacity
          onPress={statsReady ? onPress : undefined}
          activeOpacity={statsReady ? 0.7 : 1}
          disabled={!statsReady}
          accessibilityRole="button"
          accessibilityLabel={
            statsReady
              ? `${days} ${days === 1 ? "dia" : "dias"} livre de apostas. Toque se você apostou.`
              : "Carregando seu contador"
          }
        >
          {!statsReady ? (
            <View style={styles.skeleton} testID="bet-streak-skeleton">
              <View style={[styles.placeholder, { width: valueFontSize * 1.2, height: valueFontSize }]} />
              <View style={[styles.placeholder, { width: valueFontSize * 2.1, height: valueFontSize }]} />
            </View>
          ) : (
            <View>
              <View style={styles.glowWrap} pointerEvents="none">
                <Glow
                  width={valueFontSize * 4.6}
                  height={valueFontSize * 2}
                  color="#B84FD8"
                  intensity={0.32}
                />
              </View>
              <GradientText>
                <Text style={valueStyle}>{`${days}`}</Text>
                <Text style={valueStyle}>{unit}</Text>
              </GradientText>
            </View>
          )}
        </TouchableOpacity>
        {statsReady ? accessory : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  skeleton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  placeholder: {
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
});

export default BetStreakCounter;

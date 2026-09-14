import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

import { HORIZONTAL_GRADIENT_COLORS } from "../../config/colors";

/**
 * O contador de dias livre de apostas da Home.
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
}

const renderGradientText = (text: string, style: object) => (
  <MaskedView
    maskElement={
      <Text style={[style, { backgroundColor: "transparent" }]}>{text}</Text>
    }
  >
    <LinearGradient
      colors={HORIZONTAL_GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <Text style={[style, { opacity: 0 }]}>{text}</Text>
    </LinearGradient>
  </MaskedView>
);

const BetStreakCounter: React.FC<BetStreakCounterProps> = ({
  days,
  statsReady,
  onPress,
}) => (
  <View style={styles.freeOfBetDaysContainer}>
    <Text style={styles.freeOfBetDaysLabel}>
      Você está livre de apostas por:
    </Text>
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
      style={styles.freeOfBetDaysValueWrapper}
    >
      {!statsReady ? (
        <View style={styles.daysSkeleton} testID="bet-streak-skeleton">
          <View style={styles.daysNumberPlaceholder} />
          <View style={styles.daysUnitPlaceholder} />
        </View>
      ) : (
        <>
          {renderGradientText(`${days}`, styles.freeOfBetDaysNumber)}
          {renderGradientText(
            days === 1 ? " dia" : " dias",
            styles.freeOfBetDaysUnit
          )}
        </>
      )}
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  freeOfBetDaysContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 12,
  },
  freeOfBetDaysLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 8,
  },
  freeOfBetDaysValueWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  freeOfBetDaysNumber: {
    fontSize: 56,
    fontWeight: "bold",
  },
  freeOfBetDaysUnit: {
    fontSize: 56,
    fontWeight: "bold",
    marginLeft: 4,
  },
  daysSkeleton: {
    flexDirection: "row",
    alignItems: "center",
  },
  daysNumberPlaceholder: {
    width: 80,
    height: 56,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  daysUnitPlaceholder: {
    width: 120,
    height: 56,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginLeft: 4,
  },
});

export default BetStreakCounter;

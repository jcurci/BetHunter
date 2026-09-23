import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { StatsDisplay } from "../../../components";
import GradientText from "./GradientText";
import { HOME_FONTS, HomeLayout } from "./homeLayout";

interface HomeHeaderProps {
  layout: HomeLayout;
  greeting: string;
  /** Só o primeiro nome — ver getFirstName. */
  firstName: string;
  statsLoading: boolean;
  energy?: number;
  streak?: string;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  layout,
  greeting,
  firstName,
  statsLoading,
  energy,
  streak,
}) => {
  const { s } = layout;
  const fontSize = s(30);
  const textStyle = {
    fontSize,
    // Line height folgado evita cortar ascendentes/descendentes no MaskedView;
    // a aproximação das linhas vem da margem negativa do nome.
    lineHeight: Math.round(fontSize * 1.12),
    letterSpacing: -fontSize * 0.055,
  };

  return (
    <View style={styles.row}>
      <View style={styles.greeting}>
        <Text style={[styles.greetingText, textStyle]}>{greeting}</Text>
        <GradientText style={[styles.nameMask, { marginTop: -Math.round(fontSize * 0.26) }]}>
          <Text style={[styles.greetingText, textStyle]} numberOfLines={1}>
            {firstName}
          </Text>
        </GradientText>
      </View>
      <StatsDisplay loading={statsLoading} energy={energy} streak={streak} style={{ gap: s(6) }} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    flex: 1,
    paddingRight: 12,
  },
  nameMask: {
    alignSelf: "flex-start",
  },
  greetingText: {
    color: "#F2EFF5",
    fontFamily: HOME_FONTS.bold,
    includeFontPadding: false,
  },
});

export default HomeHeader;

import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

import { BRAND_GRADIENT_COLORS, BRAND_GRADIENT_LOCATIONS } from "../../../config/colors";

interface GradientTextProps {
  /** Um ou mais <Text>; o gradiente atravessa todos como uma peça só. */
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  colors?: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

/**
 * Texto preenchido com o gradiente da marca.
 *
 * Mesmo padrão MaskedView + LinearGradient que a Home já usava, com uma
 * diferença: aceita vários <Text> lado a lado, então "33" e " dias" recebem um
 * único gradiente contínuo em vez de um reinício por pedaço.
 */
const GradientText: React.FC<GradientTextProps> = ({
  children,
  style,
  colors = BRAND_GRADIENT_COLORS,
  locations = BRAND_GRADIENT_LOCATIONS,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
}) => (
  <MaskedView
    style={style}
    maskElement={
      <View style={{ flexDirection: "row", alignItems: "baseline", backgroundColor: "transparent" }}>
        {children}
      </View>
    }
  >
    <LinearGradient colors={colors} locations={locations} start={start} end={end}>
      <View style={{ flexDirection: "row", alignItems: "baseline", opacity: 0 }}>{children}</View>
    </LinearGradient>
  </MaskedView>
);

export default GradientText;

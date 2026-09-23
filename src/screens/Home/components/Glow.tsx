import React, { useId } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

interface GlowProps {
  width: number;
  height: number;
  color: string;
  /** Opacidade no centro do halo. */
  intensity?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Halo de luz colorida. Substitui o blur/shadow colorido, que o Android não
 * desenha: é uma elipse com gradiente radial, então fica igual nas duas
 * plataformas e custa um único desenho estático.
 */
const Glow: React.FC<GlowProps> = ({ width, height, color, intensity = 0.45, style }) => {
  const id = `glow${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <Svg width={width} height={height} style={style} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={color} stopOpacity={intensity} />
          <Stop offset="0.45" stopColor={color} stopOpacity={intensity * 0.45} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} fill={`url(#${id})`} />
    </Svg>
  );
};

export default React.memo(Glow);

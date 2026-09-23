import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

/**
 * Composição da Home refatorada.
 *
 * As referências foram desenhadas em 393×852 (1572 px @4x). Toda medida abaixo
 * está nessa base e é escalada pela tela real: `s()` pela largura (tamanhos,
 * fontes, larguras) e `v()` pela altura (respiros verticais e a Betty), para a
 * tela caber sem rolar em aparelhos baixos e não sobrar vazio nos altos.
 */
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Pesos da Inter Tight registrados no useFonts do App.tsx. */
export const HOME_FONTS = {
  regular: "InterTight_400Regular",
  medium: "InterTight_500Medium",
  bold: "InterTight_700Bold",
  heavy: "InterTight_800ExtraBold",
} as const;

export interface HomeLayout {
  width: number;
  /** Escala pela largura — tamanhos e fontes. */
  s: (value: number) => number;
  /** Escala pela altura — respiros verticais. */
  v: (value: number) => number;
  /** Margem lateral do conteúdo. */
  gutter: number;
  contentWidth: number;
  bettyHeight: number;
  /** Lado do card do carrossel (quadrado). */
  cardSize: number;
  cardGap: number;
}

export function useHomeLayout(): HomeLayout {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const widthScale = clamp(width / BASE_WIDTH, 0.82, 1.2);
    // Telas baixas comprimem os respiros; fontes nunca ficam maiores que a largura permite.
    const heightScale = clamp(height / BASE_HEIGHT, 0.78, 1.12);
    const s = (value: number) => Math.round(value * widthScale);
    const v = (value: number) => Math.round(value * heightScale);

    const gutter = s(22);
    const contentWidth = width - gutter * 2;
    const cardGap = s(16);
    const cardSize = Math.floor((contentWidth - cardGap * 2) / 3);

    return {
      width,
      s,
      v,
      gutter,
      contentWidth,
      // A arte ocupa ~87% da altura do viewBox; 170 dá os ~148 dp visíveis do design.
      bettyHeight: Math.round(170 * Math.min(heightScale, widthScale * 1.05)),
      cardSize,
      cardGap,
    };
  }, [width, height]);
}

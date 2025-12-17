/**
 * Cores globais do BetHunter
 * Constantes de gradientes e cores utilizadas em todo o aplicativo
 */

/**
 * Gradiente horizontal padrão
 * Usado em textos, botões e elementos de destaque
 * Direção: da esquerda (roxo) para direita (laranja-avermelhado)
 */
export const HORIZONTAL_GRADIENT_COLORS = ["#7456C8", "#D783D8", "#FF90A5", "#FF6A56"] as const;

/**
 * Localizações das cores no gradiente horizontal (em percentual)
 * 0% - Roxo (#7456C8)
 * 34% - Rosa-roxo claro (#D783D8)
 * 69% - Rosa (#FF90A5)
 * 100% - Laranja-avermelhado (#FF6A56)
 */
export const HORIZONTAL_GRADIENT_LOCATIONS = [0, 0.34, 0.69, 1] as const;

/**
 * Configuração padrão do gradiente horizontal
 * Para uso em LinearGradient do expo-linear-gradient
 */
export const HORIZONTAL_GRADIENT = {
  colors: HORIZONTAL_GRADIENT_COLORS,
  locations: HORIZONTAL_GRADIENT_LOCATIONS,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0 },
} as const;




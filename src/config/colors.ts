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

/**
 * Gradiente de fundo radial (efeito spotlight)
 * Usado em modais, cards e backgrounds
 * Efeito: cor roxa irradiando do centro superior para preto
 */
export const BACKGROUND_GRADIENT_COLORS = ["#443570", "#443045", "#2F2229", "#1A1923", "#000000"] as const;
export const BACKGROUND_GRADIENT_LOCATIONS = [0, 0.15, 0.32, 0.62, 1] as const;
export const SHADOW_OVERLAY_COLORS = ['rgba(0,0,0,0.7)', 'transparent', 'transparent'] as const;

/**
 * Configuração padrão do gradiente de fundo radial
 * Para uso com o componente RadialGradientBackground
 */
export const BACKGROUND_GRADIENT = {
  colors: BACKGROUND_GRADIENT_COLORS,
  locations: BACKGROUND_GRADIENT_LOCATIONS,
  shadowColors: SHADOW_OVERLAY_COLORS,
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
} as const;

/**
 * Gradiente de borda para botões (estilo igual ao componente de pesquisa)
 * Efeito: borda com gradiente vertical que vai de cinza para escuro e volta
 * Usado em botões de confirmação, ícones circulares, pesquisa, etc.
 */
export const BUTTON_BORDER_GRADIENT_COLORS = ["#373344", "#1A1825", "#373344"] as const;
export const BUTTON_BORDER_GRADIENT_LOCATIONS = [0, 0.5, 1] as const;

/**
 * Highlight no topo dos botões (efeito luminoso)
 */
export const BUTTON_HIGHLIGHT_COLORS = ["rgba(255,255,255,0.35)", "rgba(255,255,255,0)"] as const;

/**
 * Cor de fundo interna dos botões com borda gradiente
 */
export const BUTTON_INNER_BACKGROUND = "#16141F";
export const BUTTON_INNER_BORDER_COLOR = "#2B2737";

/**
 * Configuração padrão do gradiente de borda para botões
 */
export const BUTTON_BORDER_GRADIENT = {
  colors: BUTTON_BORDER_GRADIENT_COLORS,
  locations: BUTTON_BORDER_GRADIENT_LOCATIONS,
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
} as const;




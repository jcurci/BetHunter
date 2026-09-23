/**
 * Cores globais do BetHunter
 * Constantes de gradientes e cores utilizadas em todo o aplicativo
 */

/**
 * Gradiente horizontal padrão
 * Usado em textos, botões e elementos de destaque
 * Direção: da esquerda (roxo) para direita (laranja-avermelhado)
 */
export const HORIZONTAL_GRADIENT_COLORS = ["#5026C7", "#DE57DF", "#E07085", "#FF4C33"] as const;

/**
 * Localizações das cores no gradiente horizontal (em percentual)
 * 0% - Roxo (#5026C7)
 * 33% - Magenta (#DE57DF)
 * 66% - Rosa-salmão (#E07085)
 * 100% - Laranja-avermelhado (#FF4C33)
 */
export const HORIZONTAL_GRADIENT_LOCATIONS = [0, 0.33, 0.66, 1] as const;

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

/**
 * Botão de vidro — "Button/Glass/Inactive" no Figma.
 * Preenchimento preto a 40%, blur do que está atrás e sombra sutil.
 * Substitui a borda gradiente no GradientBorderButton.
 */
export const BUTTON_GLASS_BACKGROUND = "rgba(0,0,0,0.4)";
export const BUTTON_GLASS_BORDER_COLOR = "rgba(255,255,255,0.08)";

/**
 * O Figma especifica blur de 5px; o expo-blur usa uma escala 0–100 sem
 * equivalência direta em pixels. 20 é a aproximação mais próxima do efeito.
 */
export const BUTTON_GLASS_BLUR_INTENSITY = 20;

/**
 * Sombra do Figma: X 0 · Y 1 · Blur 8 · #000 10%.
 * shadowRadius do RN equivale a ~metade do blur do Figma.
 */
export const BUTTON_GLASS_SHADOW = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
} as const;



/**
 * Gradiente da marca — versão saturada usada na Home refatorada.
 * Textos de destaque, barra de progresso, anéis iluminados e glow.
 * 0% #5026C7 · 33% #DE57DF · 66% #E07085 · 100% #FF4C33
 */
export const BRAND_GRADIENT_COLORS = HORIZONTAL_GRADIENT_COLORS;
export const BRAND_GRADIENT_LOCATIONS = HORIZONTAL_GRADIENT_LOCATIONS;

/**
 * Fundo da Home: luz roxa no topo caindo para quase preto.
 * Cobre a tela inteira (inclusive atrás da taskbar).
 */
export const HOME_BACKGROUND_COLORS = ["#4A3A7A", "#3E2C52", "#2B1F2C", "#16121A", "#0B0A0E"] as const;
export const HOME_BACKGROUND_LOCATIONS = [0, 0.16, 0.36, 0.62, 1] as const;
/** Vinheta lateral — escurece as bordas para o topo parecer um spotlight. */
export const HOME_VIGNETTE_COLORS = ["rgba(8,6,12,0.55)", "rgba(8,6,12,0)", "rgba(8,6,12,0)", "rgba(8,6,12,0.55)"] as const;
export const HOME_VIGNETTE_LOCATIONS = [0, 0.3, 0.7, 1] as const;

/**
 * Liquid glass — superfícies escuras translúcidas com borda iluminada por cima.
 * Sem blur real (instável no Android): o efeito vem das camadas.
 */
export const GLASS_FILL_COLORS = ["rgba(34,31,44,0.92)", "rgba(20,18,27,0.94)"] as const;
/** Borda: luz entrando pelo topo e sumindo embaixo. */
export const GLASS_BORDER_COLORS = [
  "rgba(255,255,255,0.20)",
  "rgba(255,255,255,0.06)",
  "rgba(255,255,255,0.03)",
  "rgba(255,255,255,0.10)",
] as const;
export const GLASS_BORDER_LOCATIONS = [0, 0.35, 0.7, 1] as const;
/** Reflexo difuso no topo da superfície. */
export const GLASS_HIGHLIGHT_COLORS = ["rgba(255,255,255,0.07)", "rgba(255,255,255,0)"] as const;
export const GLASS_SHADOW = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 12,
  elevation: 6,
} as const;

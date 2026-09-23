import type React from "react";
import type { SvgProps } from "react-native-svg";

import AssessorIcon from "../../../assets/home/assessor.svg";
import CursosIcon from "../../../assets/home/cursos.svg";
import type { RootStackParamList } from "../../../types/navigation";

/**
 * Conteúdo do carrossel de atalhos da Home.
 *
 * Cada página tem exatamente 3 cards (a composição do design). A página 1 é a
 * do design; as páginas 2 e 3 são MOCKS com a mesma composição, apontando para
 * telas que já existem, até o conteúdo definitivo chegar. Para trocar por dados
 * reais basta substituir este array (ou montá-lo a partir de um store) — o
 * HomeCarousel só lê `CarouselPage[]`.
 */

/** Rotas sem parâmetros — as únicas que um atalho pode abrir. */
type ParamlessRoute = {
  [K in keyof RootStackParamList]: undefined extends RootStackParamList[K] ? K : never;
}[keyof RootStackParamList];

export type CarouselCardIcon =
  /** Logo do app — resolvido pelo BetHunterLogoSlot. */
  | { kind: "logo" }
  /** Ícone SVG que já existe em assets/home. */
  | { kind: "svg"; Component: React.FC<SvgProps> }
  /** Ícone do MaterialCommunityIcons (react-native-vector-icons). */
  | { kind: "icon"; name: string };

export interface CarouselCard {
  id: string;
  title: string;
  icon: CarouselCardIcon;
  route: ParamlessRoute;
}

export interface CarouselPage {
  id: string;
  cards: readonly [CarouselCard, CarouselCard, CarouselCard];
}

export const CAROUSEL_PAGES: readonly CarouselPage[] = [
  {
    id: "principal",
    cards: [
      { id: "minha-conta", title: "Minha\nConta", icon: { kind: "logo" }, route: "MinhaConta" },
      { id: "meu-assessor", title: "Meu\nAssessor", icon: { kind: "svg", Component: AssessorIcon }, route: "Assessor" },
      { id: "menu-educacional", title: "Menu\nEducacional", icon: { kind: "svg", Component: CursosIcon }, route: "MenuEducacional" },
    ],
  },
  {
    // MOCK — mesma composição; o SOS saiu da fileira de ações e mora aqui.
    id: "cuidado",
    cards: [
      { id: "sos", title: "SOS\nFissura", icon: { kind: "icon", name: "lifebuoy" }, route: "SOSMenu" },
      { id: "minha-jornada", title: "Minha\nJornada", icon: { kind: "icon", name: "map-marker-path" }, route: "MinhaJornada" },
      { id: "modo-orcamento", title: "Modo\nOrçamento", icon: { kind: "icon", name: "wallet-outline" }, route: "ModoOrcamento" },
    ],
  },
  {
    // MOCK — mesma composição.
    id: "estudos",
    cards: [
      { id: "cursos-salvos", title: "Cursos\nSalvos", icon: { kind: "icon", name: "bookmark-outline" }, route: "CursosSalvos" },
      { id: "ranking", title: "Ranking", icon: { kind: "icon", name: "trophy-outline" }, route: "Ranking" },
      { id: "graficos", title: "Meus\nGráficos", icon: { kind: "icon", name: "chart-line" }, route: "Graficos" },
    ],
  },
];

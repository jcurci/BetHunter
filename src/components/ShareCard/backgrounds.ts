/**
 * Registry dos fundos do card de compartilhamento.
 *
 * Cada PNG é 1080x1350 e já traz achatados o fundo, o logo do tigre, os textos
 * fixos, o lettering e o CTA. O código só desenha o número — ver
 * `shareCardLayout.ts` e docs/share-card-contador.md.
 *
 * Para adicionar um fundo novo: soltar o arquivo em src/assets/share-card/,
 * acrescentar uma linha em FUNDOS e a cor do número em `CORES_POR_FUNDO`
 * (shareCardLayout.ts). Nenhum componente muda.
 */

import { ImageSourcePropType } from 'react-native';

export const FUNDOS = {
  bgColorido: require('../../assets/share-card/bgColorido.png'),
  bgPreto: require('../../assets/share-card/bgPreto.png'),
  bgBranco: require('../../assets/share-card/bgBranco.png'),
} as const;

export type FundoId = keyof typeof FUNDOS;

export const FUNDO_IDS = Object.keys(FUNDOS) as FundoId[];

/** Sorteia um dos fundos. */
export function sortearFundo(): FundoId {
  return FUNDO_IDS[Math.floor(Math.random() * FUNDO_IDS.length)];
}

/** Resolve o asset de um fundo. */
export function fundoSource(id: FundoId | null): ImageSourcePropType | null {
  if (!id) return null;
  return FUNDOS[id] ?? null;
}

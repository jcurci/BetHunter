import {
  LER_SVG,
  LER_BLOCK_SVG,
  DONE_SVG,
  LOCKED_SVG,
  RECOMPENSA_SVG,
  makeUniqueSvg,
} from '../../assets/icon-ilha/rawSvgStrings';

export { makeUniqueSvg };

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModuleVisualState =
  | 'default'
  | 'active'
  | 'completed'
  | 'locked'
  | 'clicked';

type StateSvgMap = Partial<Record<ModuleVisualState, string>>;

// ─── Dimensions ───────────────────────────────────────────────────────────────
// renderW/renderH: dimensions passed to <SvgXml width=… height=…>
// bodyH: visual island body height (excludes drop-shadow) — used for connector
//        attachment points and ActiveGlow sizing

export interface NodeDims {
  renderW: number;
  renderH: number;
  bodyH: number;
}

export const NODE_SVG_DIMS: Record<string, NodeDims> = {
  MATERIAL: { renderW: 118, renderH: 115, bodyH: 86 },
  QUIZ:     { renderW: 118, renderH: 115, bodyH: 86 },
  REWARD:   { renderW: 132, renderH: 123, bodyH: 105 },
};

export const DEFAULT_NODE_DIMS: NodeDims = { renderW: 118, renderH: 115, bodyH: 86 };

// ─── SVG string map ───────────────────────────────────────────────────────────
// Phase 1: all states use the base SVG string.
// To wire future assets, replace the value in the matching state cell — no
// other code needs to change.
//
//  MATERIAL  base: LER_SVG
//  QUIZ      base: DONE_SVG
//  REWARD    base: RECOMPENSA_SVG

const MODULE_SVGS: Record<string, StateSvgMap> = {
  MATERIAL: {
    default:   LER_SVG,
    active:    LER_SVG,
    completed: LER_SVG,
    locked:    LER_BLOCK_SVG,
    clicked:   LER_SVG,
  },
  QUIZ: {
    default:   DONE_SVG,
    active:    DONE_SVG,
    completed: DONE_SVG,
    locked:    LOCKED_SVG,
    clicked:   DONE_SVG,
  },
  REWARD: {
    default:   RECOMPENSA_SVG,
    active:    RECOMPENSA_SVG,
    completed: RECOMPENSA_SVG,
    locked:    RECOMPENSA_SVG,
    clicked:   RECOMPENSA_SVG,
  },
};

// ─── Resolver ─────────────────────────────────────────────────────────────────

export function resolveModuleSvgString(
  moduleType: string,
  state: ModuleVisualState = 'default',
): string {
  const typeMap = MODULE_SVGS[moduleType];
  if (!typeMap) return LER_SVG;
  return typeMap[state] ?? typeMap.default ?? LER_SVG;
}

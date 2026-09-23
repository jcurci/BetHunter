import { create } from 'zustand';

/**
 * Controle fino da taskbar global (ver Footer).
 *
 * A visibilidade normal sai da rota atual; isto só cobre o caso de uma tela de
 * aba que ainda não tem conteúdo para mostrar (ex.: a Home no boot, exibindo
 * o AppLoadingScreen), onde a barra flutuando por cima do loader ficaria solta.
 */
interface TabBarStore {
  suppressed: boolean;
  setSuppressed: (suppressed: boolean) => void;
}

export const useTabBarStore = create<TabBarStore>((set) => ({
  suppressed: false,
  setSuppressed: (suppressed) => set({ suppressed }),
}));

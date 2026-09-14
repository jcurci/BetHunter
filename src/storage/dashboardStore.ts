import { create } from 'zustand';
import { Container } from '../infrastructure/di/Container';
import {
  BetStreakDuration,
  ZERO_BET_STREAK_DURATION,
} from '../domain/entities/BetStreakDuration';

const TTL = 10 * 60 * 1000; // 10 minutos em milissegundos

/**
 * O contador agora é uma duração viva: o backend calcula a partir de
 * `bet_free_since_at` no instante da consulta. Com o TTL de 10 min do dashboard
 * a Home voltaria do segundo plano mostrando um valor velho, então o bet streak
 * tem o seu próprio, bem mais curto.
 */
const BET_STREAK_TTL = 60 * 1000;

/**
 * Interface do DashboardStore
 */
interface DashboardStore {
  // State
  dashboard: { energy: number; streak: number } | null;
  /** Tempo livre de apostas. A Home mostra só `days`; horas/minutos ficam
   *  disponíveis para o card de compartilhamento. */
  betStreak: BetStreakDuration;
  isLoading: boolean;
  loadError: string | null;
  lastFetchedDashboard: number | null;  // timestamp ms
  lastFetchedBetStreak: number | null;  // timestamp ms

  // Actions
  /** Com `force=true`, ignora TTL e atualiza dashboard + bet streak. */
  loadAll: (force?: boolean) => Promise<void>;
  loadDashboard: (force?: boolean) => Promise<void>;
  /** Devolve a duração recém-gravada — o card de compartilhamento precisa do
   *  valor fresco, não do que estiver no estado no momento da chamada. */
  loadBetStreak: (force?: boolean) => Promise<BetStreakDuration>;
  clearLoadError: () => void;
  invalidate: () => void;               // zera timestamps → força refetch
}

/**
 * DashboardStore - Estado reativo de dashboard e bet streak
 * Usa Zustand para gerenciamento de estado com cache TTL de 10 minutos
 */
/**
 * Um `loadError` só deve sobreviver enquanto ainda falta dado na tela.
 *
 * Chamado no sucesso de cada carga. Sem isso o erro do boot ficava preso: as
 * consultas de foco e de volta do segundo plano chamam `loadDashboard` /
 * `loadBetStreak` direto, sem passar pelo `loadAll` — que é o único lugar que
 * zerava o erro. O resultado era a Home mostrando o contador certo atrás de um
 * alerta de falha que já não valia mais.
 *
 * A limpeza exige as **duas** fontes carregadas: se o dashboard continua
 * quebrado, o erro tem de continuar à vista mesmo com o contador funcionando.
 */
function limparErroSeTudoCarregou(set: any, get: any): void {
  const { lastFetchedDashboard, lastFetchedBetStreak, loadError } = get();
  if (loadError && lastFetchedDashboard !== null && lastFetchedBetStreak !== null) {
    console.log('✅ [DashboardStore] Dados completos, limpando erro anterior');
    set({ loadError: null });
  }
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // State inicial
  dashboard: null,
  betStreak: { ...ZERO_BET_STREAK_DURATION },
  isLoading: false,
  loadError: null,
  lastFetchedDashboard: null,
  lastFetchedBetStreak: null,

  /**
   * Carrega dashboard e bet streak em paralelo, respeitando TTL (a menos que force=true)
   */
  loadAll: async (force = false) => {
    const state = get();
    const now = Date.now();
    
    // Verifica se precisa buscar dashboard
    const needsDashboard =
      force ||
      state.lastFetchedDashboard === null ||
      now - state.lastFetchedDashboard >= TTL;

    // Verifica se precisa buscar bet streak
    const needsBetStreak =
      force ||
      state.lastFetchedBetStreak === null ||
      now - state.lastFetchedBetStreak >= BET_STREAK_TTL;

    // Se ambos ainda estão frescos, não faz nada
    if (!needsDashboard && !needsBetStreak) {
      console.log('✅ [DashboardStore] Dados ainda frescos no cache, sem necessidade de refetch');
      return;
    }

    set({ isLoading: true, loadError: null });

    try {
      const promises: Promise<void>[] = [];

      // Adiciona promise do dashboard se necessário
      if (needsDashboard) {
        promises.push(get().loadDashboard(true));
      }

      // Adiciona promise do bet streak se necessário
      if (needsBetStreak) {
        promises.push(get().loadBetStreak(true).then(() => undefined));
      }

      // Executa em paralelo
      await Promise.all(promises);

      console.log('✅ [DashboardStore] loadAll() concluído');
    } catch (error) {
      console.error('❌ [DashboardStore] Erro no loadAll():', error);
      set({ loadError: 'Ocorreu um erro ao carregar os dados. Tente novamente.' });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Carrega dados do dashboard (/users/dashboard)
   */
  loadDashboard: async (force = false) => {
    const state = get();
    const now = Date.now();

    // Verifica TTL a menos que seja forçado
    if (!force && state.lastFetchedDashboard !== null && 
        (now - state.lastFetchedDashboard) < TTL) {
      console.log('✅ [DashboardStore] Dashboard ainda fresco no cache');
      return;
    }

    try {
      console.log('🔗 [DashboardStore] Carregando dashboard...');
      
      const container = Container.getInstance();
      const useCase = container.getLoadDashboardUseCase();
      const result = await useCase.execute();

      set({
        dashboard: { energy: result.energy, streak: result.streak },
        lastFetchedDashboard: now,
      });
      limparErroSeTudoCarregou(set, get);

      console.log('✅ [DashboardStore] Dashboard carregado:', result);
    } catch (error: any) {
      console.error('❌ [DashboardStore] Erro ao carregar dashboard:', error?.message ?? error);
      throw error;
    }
  },

  /**
   * Carrega dados do bet streak (GET /users/bet-streak).
   *
   * O backend é a única fonte do tempo acumulado — o store guarda o que veio e
   * nada mais. Num erro a exceção sobe e o valor anterior **fica de pé**: falha
   * de rede não é zero dia.
   */
  loadBetStreak: async (force = false) => {
    const state = get();
    const now = Date.now();

    // Verifica TTL a menos que seja forçado
    if (!force && state.lastFetchedBetStreak !== null &&
        (now - state.lastFetchedBetStreak) < BET_STREAK_TTL) {
      console.log('✅ [DashboardStore] Bet streak ainda fresco no cache');
      return state.betStreak;
    }

    try {
      console.log('🔗 [DashboardStore] Carregando bet streak...');

      const container = Container.getInstance();
      const useCase = container.getGetBetStreakUseCase();
      const betStreak = await useCase.execute();

      set({
        betStreak,
        lastFetchedBetStreak: now,
      });
      limparErroSeTudoCarregou(set, get);

      console.log('✅ [DashboardStore] Bet streak carregado:', betStreak);
      return betStreak;
    } catch (error: any) {
      console.error('❌ [DashboardStore] Erro ao carregar bet streak:', error?.message ?? error);
      throw error;
    }
  },

  clearLoadError: () => set({ loadError: null }),

  /**
   * Invalida o cache forçando refetch na próxima chamada
   * Usado principalmente no logout
   */
  invalidate: () => {
    console.log('🔄 [DashboardStore] Cache invalidado');
    
    set({
      dashboard: null,
      betStreak: { ...ZERO_BET_STREAK_DURATION },
      lastFetchedDashboard: null,
      lastFetchedBetStreak: null,
    });
  },
}));

/**
 * Dias livres de apostas — o único recorte que as telas exibem hoje.
 * Seletor dedicado para as telas não dependerem do formato completo.
 */
export const useBetStreakDays = (): number =>
  useDashboardStore((s) => s.betStreak.days);

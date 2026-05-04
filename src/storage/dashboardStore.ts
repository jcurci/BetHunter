import { create } from 'zustand';
import { Container } from '../infrastructure/di/Container';

const TTL = 10 * 60 * 1000; // 10 minutos em milissegundos

/**
 * Interface do DashboardStore
 */
interface DashboardStore {
  // State
  dashboard: { energy: number; streak: number } | null;
  betStreak: number;
  canCheckIn: boolean;
  nextCheckInAt: string | null;
  isLoading: boolean;
  lastFetchedDashboard: number | null;  // timestamp ms
  lastFetchedBetStreak: number | null;  // timestamp ms

  // Actions
  loadAll: () => Promise<void>;          // busca os dois em paralelo (com TTL)
  loadDashboard: (force?: boolean) => Promise<void>;
  loadBetStreak: (force?: boolean) => Promise<void>;
  updateAfterCheckIn: (betStreak: number, nextCheckInAt: string) => void;
  invalidate: () => void;               // zera timestamps → força refetch
}

/**
 * DashboardStore - Estado reativo de dashboard e bet streak
 * Usa Zustand para gerenciamento de estado com cache TTL de 10 minutos
 */
export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // State inicial
  dashboard: null,
  betStreak: 0,
  canCheckIn: false,
  nextCheckInAt: null,
  isLoading: false,
  lastFetchedDashboard: null,
  lastFetchedBetStreak: null,

  /**
   * Carrega dashboard e bet streak em paralelo, respeitando TTL
   */
  loadAll: async () => {
    const state = get();
    const now = Date.now();
    
    // Verifica se precisa buscar dashboard
    const needsDashboard = state.lastFetchedDashboard === null || 
                          (now - state.lastFetchedDashboard) >= TTL;
    
    // Verifica se precisa buscar bet streak
    const needsBetStreak = state.lastFetchedBetStreak === null || 
                          (now - state.lastFetchedBetStreak) >= TTL;

    // Se ambos ainda estão frescos, não faz nada
    if (!needsDashboard && !needsBetStreak) {
      console.log('✅ [DashboardStore] Dados ainda frescos no cache, sem necessidade de refetch');
      return;
    }

    set({ isLoading: true });

    try {
      const promises: Promise<void>[] = [];

      // Adiciona promise do dashboard se necessário
      if (needsDashboard) {
        promises.push(get().loadDashboard(true));
      }

      // Adiciona promise do bet streak se necessário  
      if (needsBetStreak) {
        promises.push(get().loadBetStreak(true));
      }

      // Executa em paralelo
      await Promise.all(promises);

      console.log('✅ [DashboardStore] loadAll() concluído');
    } catch (error) {
      console.error('❌ [DashboardStore] Erro no loadAll():', error);
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

      console.log('✅ [DashboardStore] Dashboard carregado:', result);
    } catch (error: any) {
      console.error('❌ [DashboardStore] Erro ao carregar dashboard:', error?.message ?? error);
      throw error;
    }
  },

  /**
   * Carrega dados do bet streak (/users/bet-checkin)
   */
  loadBetStreak: async (force = false) => {
    const state = get();
    const now = Date.now();

    // Verifica TTL a menos que seja forçado
    if (!force && state.lastFetchedBetStreak !== null && 
        (now - state.lastFetchedBetStreak) < TTL) {
      console.log('✅ [DashboardStore] Bet streak ainda fresco no cache');
      return;
    }

    try {
      console.log('🔗 [DashboardStore] Carregando bet streak...');
      
      const container = Container.getInstance();
      const useCase = container.getGetBetStreakStatusUseCase();
      const result = await useCase.execute();

      set({
        betStreak: result.betStreak,
        canCheckIn: result.canCheckIn,
        nextCheckInAt: result.nextCheckInAt,
        lastFetchedBetStreak: now,
      });

      console.log('✅ [DashboardStore] Bet streak carregado:', result);
    } catch (error: any) {
      console.error('❌ [DashboardStore] Erro ao carregar bet streak:', error?.message ?? error);
      throw error;
    }
  },

  /**
   * Atualiza o store localmente após check-in bem-sucedido
   * Evita nova chamada de API
   */
  updateAfterCheckIn: (betStreak: number, nextCheckInAt: string) => {
    console.log('✅ [DashboardStore] Atualizando após check-in:', { betStreak, nextCheckInAt });
    
    set({
      betStreak,
      canCheckIn: false, // Após check-in, não pode mais fazer check-in hoje
      nextCheckInAt,
      // Mantém o timestamp do bet streak como se tivesse sido buscado agora
      lastFetchedBetStreak: Date.now(),
    });
  },

  /**
   * Invalida o cache forçando refetch na próxima chamada
   * Usado principalmente no logout
   */
  invalidate: () => {
    console.log('🔄 [DashboardStore] Cache invalidado');
    
    set({
      dashboard: null,
      betStreak: 0,
      canCheckIn: false,
      nextCheckInAt: null,
      lastFetchedDashboard: null,
      lastFetchedBetStreak: null,
    });
  },
}));
import { useDashboardStore } from '../dashboardStore';
import { Container } from '../../infrastructure/di/Container';

jest.mock('../../infrastructure/di/Container', () => ({
  Container: { getInstance: jest.fn() },
}));

const getBetStreak = jest.fn();
const resetBetStreak = jest.fn();
const loadDashboard = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});

  (Container.getInstance as jest.Mock).mockReturnValue({
    getGetBetStreakUseCase: () => ({ execute: getBetStreak }),
    getResetBetStreakUseCase: () => ({ execute: resetBetStreak }),
    getLoadDashboardUseCase: () => ({ execute: loadDashboard }),
  });

  useDashboardStore.getState().invalidate();
});

describe('loadBetStreak', () => {
  it('grava os três componentes vindos da API', async () => {
    getBetStreak.mockResolvedValue({ days: 6, hours: 5, minutes: 28 });

    await useDashboardStore.getState().loadBetStreak(true);

    expect(useDashboardStore.getState().betStreak).toEqual({
      days: 6,
      hours: 5,
      minutes: 28,
    });
  });

  it('devolve a duração para quem precisa do valor fresco', async () => {
    getBetStreak.mockResolvedValue({ days: 6, hours: 5, minutes: 28 });

    await expect(useDashboardStore.getState().loadBetStreak(true)).resolves.toEqual({
      days: 6,
      hours: 5,
      minutes: 28,
    });
  });

  it('mostra zero dias após um reset, não um', async () => {
    getBetStreak.mockResolvedValue({ days: 12, hours: 3, minutes: 9 });
    await useDashboardStore.getState().loadBetStreak(true);

    // Reset e recarga: o backend passa a devolver a duração zerada.
    resetBetStreak.mockResolvedValue({ success: true });
    getBetStreak.mockResolvedValue({ days: 0, hours: 0, minutes: 0 });
    await useDashboardStore.getState().loadBetStreak(true);

    expect(useDashboardStore.getState().betStreak).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
    });
  });

  it('preserva o valor anterior quando a consulta falha', async () => {
    getBetStreak.mockResolvedValue({ days: 6, hours: 5, minutes: 28 });
    await useDashboardStore.getState().loadBetStreak(true);

    getBetStreak.mockRejectedValue(new Error('offline'));
    await expect(useDashboardStore.getState().loadBetStreak(true)).rejects.toThrow('offline');

    // Erro não é zero dia.
    expect(useDashboardStore.getState().betStreak).toEqual({
      days: 6,
      hours: 5,
      minutes: 28,
    });
  });

  it('serve do cache dentro do TTL e refaz a consulta quando forçado', async () => {
    getBetStreak.mockResolvedValue({ days: 4, hours: 1, minutes: 1 });

    await useDashboardStore.getState().loadBetStreak(true);
    await useDashboardStore.getState().loadBetStreak();
    expect(getBetStreak).toHaveBeenCalledTimes(1);

    await useDashboardStore.getState().loadBetStreak(true);
    expect(getBetStreak).toHaveBeenCalledTimes(2);
  });
});

/**
 * `days: 0` sozinho é ambíguo: pode ser um usuário que acabou de resetar ou uma
 * consulta que nunca voltou. `lastFetchedBetStreak` é o que desempata — a Home
 * usa exatamente isso para não desenhar "0 dias" antes de saber.
 */
describe('saber diferenciar zero dia de contador não carregado', () => {
  it('nasce sem marca de carga', () => {
    expect(useDashboardStore.getState().lastFetchedBetStreak).toBeNull();
    expect(useDashboardStore.getState().betStreak.days).toBe(0);
  });

  it('marca a carga só depois de a consulta voltar', async () => {
    getBetStreak.mockResolvedValue({ days: 0, hours: 0, minutes: 0 });

    await useDashboardStore.getState().loadBetStreak(true);

    expect(useDashboardStore.getState().lastFetchedBetStreak).not.toBeNull();
    expect(useDashboardStore.getState().betStreak.days).toBe(0);
  });

  it('continua sem marca quando a consulta falha', async () => {
    getBetStreak.mockRejectedValue(new Error('offline'));

    await expect(useDashboardStore.getState().loadBetStreak(true)).rejects.toThrow();

    // Zero na tela seria mentira: nunca soubemos o valor.
    expect(useDashboardStore.getState().lastFetchedBetStreak).toBeNull();
  });
});

/**
 * O erro do boot não pode sobreviver à consulta que o resolveu — era o que
 * deixava a Home com o contador certo atrás de um alerta de falha.
 */
describe('ciclo de vida do loadError', () => {
  it('some quando as duas fontes carregam depois da falha', async () => {
    getBetStreak.mockRejectedValue(new Error('500'));
    loadDashboard.mockResolvedValue({ energy: 5, streak: 0 });

    await useDashboardStore.getState().loadAll(true);
    expect(useDashboardStore.getState().loadError).not.toBeNull();

    // Consulta seguinte (foco / volta do segundo plano) chama direto.
    getBetStreak.mockResolvedValue({ days: 4, hours: 0, minutes: 0 });
    await useDashboardStore.getState().loadBetStreak(true);

    expect(useDashboardStore.getState().loadError).toBeNull();
    expect(useDashboardStore.getState().betStreak.days).toBe(4);
  });

  it('continua à vista se o dashboard segue quebrado', async () => {
    getBetStreak.mockRejectedValue(new Error('500'));
    loadDashboard.mockRejectedValue(new Error('500'));

    await useDashboardStore.getState().loadAll(true);
    expect(useDashboardStore.getState().loadError).not.toBeNull();

    // Só o contador volta a funcionar; a energia continua sem carregar.
    getBetStreak.mockResolvedValue({ days: 4, hours: 0, minutes: 0 });
    await useDashboardStore.getState().loadBetStreak(true);

    expect(useDashboardStore.getState().loadError).not.toBeNull();
  });
});

describe('o estado de check-in não existe mais', () => {
  it('não expõe canCheckIn, nextCheckInAt nem updateAfterCheckIn', () => {
    const state = useDashboardStore.getState() as unknown as Record<string, unknown>;

    expect(state.canCheckIn).toBeUndefined();
    expect(state.nextCheckInAt).toBeUndefined();
    expect(state.updateAfterCheckIn).toBeUndefined();
  });

  it('invalidate zera o contador sem deixar campos antigos para trás', async () => {
    getBetStreak.mockResolvedValue({ days: 6, hours: 5, minutes: 28 });
    await useDashboardStore.getState().loadBetStreak(true);

    useDashboardStore.getState().invalidate();

    expect(useDashboardStore.getState().betStreak).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
    });
    expect(useDashboardStore.getState().lastFetchedBetStreak).toBeNull();
  });
});

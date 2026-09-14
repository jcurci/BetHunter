import { AppState } from 'react-native';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import { useBetStreakCounter } from '../useBetStreakCounter';
import { useDashboardStore } from '../../../storage/dashboardStore';
import { Container } from '../../../infrastructure/di/Container';
import { maybeRequestReview } from '../../../services/appReview';
import { lastCelebratedMilestone } from '../../../services/shareDiscovery';
import { scheduleMilestoneShareInvite } from '../../../services/notifications';

/** `useFocusEffect` do react-navigation é só um `useEffect` sem navegador. */
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
}));
jest.mock('../../../infrastructure/di/Container', () => ({
  Container: { getInstance: jest.fn() },
}));
jest.mock('../../../services/appReview', () => ({ maybeRequestReview: jest.fn() }));
jest.mock('../../../services/shareDiscovery', () => ({
  lastCelebratedMilestone: jest.fn(),
}));
jest.mock('../../../services/notifications', () => ({
  isMilestone: (d: number) => [1, 3, 7, 14, 21, 30, 60, 90, 180, 365].includes(d),
  scheduleMilestoneShareInvite: jest.fn(),
}));

const getBetStreak = jest.fn();
const onMilestone = jest.fn();

const montar = (statsReady = true, userId: string | null = 'user-1') =>
  renderHook(() => useBetStreakCounter({ userId, statsReady, onMilestone }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});

  (Container.getInstance as jest.Mock).mockReturnValue({
    getGetBetStreakUseCase: () => ({ execute: getBetStreak }),
  });
  (lastCelebratedMilestone as jest.Mock).mockResolvedValue(0);
  (maybeRequestReview as jest.Mock).mockResolvedValue(undefined);
  getBetStreak.mockResolvedValue({ days: 6, hours: 5, minutes: 28 });

  useDashboardStore.getState().invalidate();
});

describe('atualização automática', () => {
  it('consulta o contador ao focar a tela', async () => {
    montar();

    await waitFor(() => expect(getBetStreak).toHaveBeenCalled());
  });

  it('consulta de novo ao voltar do segundo plano', async () => {
    const addEventListener = jest.spyOn(AppState, 'addEventListener');
    montar();
    await waitFor(() => expect(getBetStreak).toHaveBeenCalledTimes(1));

    const handler = addEventListener.mock.calls.find(([evt]) => evt === 'change')?.[1] as any;

    // Fora do TTL, senão a segunda consulta seria servida do cache.
    useDashboardStore.setState({ lastFetchedBetStreak: Date.now() - 5 * 60 * 1000 });
    await act(async () => {
      handler('active');
    });

    await waitFor(() => expect(getBetStreak).toHaveBeenCalledTimes(2));
  });

  it('ignora transições que não sejam para active', async () => {
    const addEventListener = jest.spyOn(AppState, 'addEventListener');
    montar();
    await waitFor(() => expect(getBetStreak).toHaveBeenCalledTimes(1));

    const handler = addEventListener.mock.calls.find(([evt]) => evt === 'change')?.[1] as any;
    useDashboardStore.setState({ lastFetchedBetStreak: Date.now() - 5 * 60 * 1000 });
    await act(async () => {
      handler('background');
    });

    expect(getBetStreak).toHaveBeenCalledTimes(1);
  });

  it('um erro de consulta não derruba a tela nem zera o contador', async () => {
    getBetStreak.mockResolvedValueOnce({ days: 6, hours: 5, minutes: 28 });
    montar();
    await waitFor(() =>
      expect(useDashboardStore.getState().betStreak.days).toBe(6),
    );

    getBetStreak.mockRejectedValue(new Error('offline'));
    useDashboardStore.setState({ lastFetchedBetStreak: Date.now() - 5 * 60 * 1000 });
    await act(async () => {
      await useDashboardStore.getState().loadBetStreak().catch(() => {});
    });

    expect(useDashboardStore.getState().betStreak.days).toBe(6);
  });
});

describe('nada é escrito na montagem', () => {
  it('não chama reset nem qualquer inicialização do contador', async () => {
    const reset = jest.fn();
    (Container.getInstance as jest.Mock).mockReturnValue({
      getGetBetStreakUseCase: () => ({ execute: getBetStreak }),
      getResetBetStreakUseCase: () => ({ execute: reset }),
    });

    montar();
    await waitFor(() => expect(getBetStreak).toHaveBeenCalled());

    expect(reset).not.toHaveBeenCalled();
  });
});

describe('prepararCompartilhamento', () => {
  it('força uma consulta nova e devolve os três componentes', async () => {
    const { result } = montar();
    await waitFor(() => expect(getBetStreak).toHaveBeenCalledTimes(1));

    getBetStreak.mockResolvedValue({ days: 7, hours: 2, minutes: 3 });

    let duracao;
    await act(async () => {
      duracao = await result.current.prepararCompartilhamento();
    });

    // Forçado: ignora o TTL, mesmo tendo acabado de consultar.
    expect(getBetStreak).toHaveBeenCalledTimes(2);
    expect(duracao).toEqual({ days: 7, hours: 2, minutes: 3 });
  });

  it('devolve null quando a consulta falha — nada é compartilhado', async () => {
    const { result } = montar();
    await waitFor(() => expect(getBetStreak).toHaveBeenCalled());

    getBetStreak.mockRejectedValue(new Error('offline'));

    let duracao;
    await act(async () => {
      duracao = await result.current.prepararCompartilhamento();
    });

    expect(duracao).toBeNull();
  });

  it('não compartilha silenciosamente o valor antigo em caso de erro', async () => {
    const { result } = montar();
    await waitFor(() =>
      expect(useDashboardStore.getState().betStreak.days).toBe(6),
    );

    getBetStreak.mockRejectedValue(new Error('offline'));

    let duracao;
    await act(async () => {
      duracao = await result.current.prepararCompartilhamento();
    });

    // O valor velho continua no store para a Home, mas o card não o recebe.
    expect(duracao).toBeNull();
    expect(useDashboardStore.getState().betStreak.days).toBe(6);
  });
});

describe('marcos e avaliação', () => {
  it('comemora um marco novo trazido pela consulta', async () => {
    getBetStreak.mockResolvedValue({ days: 7, hours: 0, minutes: 0 });

    montar();

    await waitFor(() => expect(onMilestone).toHaveBeenCalledWith(7));
    expect(scheduleMilestoneShareInvite).toHaveBeenCalledWith(7);
  });

  it('não repete um marco já comemorado', async () => {
    (lastCelebratedMilestone as jest.Mock).mockResolvedValue(7);
    getBetStreak.mockResolvedValue({ days: 7, hours: 0, minutes: 0 });

    montar();

    await waitFor(() => expect(maybeRequestReview).toHaveBeenCalled());
    expect(onMilestone).not.toHaveBeenCalled();
  });

  it('pede avaliação num dia comum', async () => {
    getBetStreak.mockResolvedValue({ days: 2, hours: 0, minutes: 0 });

    montar();

    await waitFor(() => expect(maybeRequestReview).toHaveBeenCalledWith('user-1', 2));
    expect(onMilestone).not.toHaveBeenCalled();
  });

  it('não pede avaliação por cima do modal de conquista', async () => {
    getBetStreak.mockResolvedValue({ days: 7, hours: 0, minutes: 0 });

    montar();

    await waitFor(() => expect(onMilestone).toHaveBeenCalled());
    expect(maybeRequestReview).not.toHaveBeenCalled();
  });

  it('fica quieto enquanto os dados não carregaram', async () => {
    montar(false);

    await waitFor(() => expect(getBetStreak).toHaveBeenCalled());
    expect(onMilestone).not.toHaveBeenCalled();
    expect(maybeRequestReview).not.toHaveBeenCalled();
  });
});

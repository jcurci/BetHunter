import { BetStreakApi, parseBetStreak } from '../BetStreak.api';
import { apiClient } from '../../../services/api/apiClient';
import { AuthenticationError } from '../../../domain/errors/CustomErrors';

jest.mock('../../../services/api/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;

/** Erro no formato que o axios entrega quando o servidor respondeu. */
const httpError = (status: number) => ({ response: { status }, message: `HTTP ${status}` });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('BetStreakApi.getBetStreak', () => {
  it('consulta a rota nova, e só ela', async () => {
    mockGet.mockResolvedValue({ data: { betStreak: { days: 6, hours: 5, minutes: 28 } } });

    await new BetStreakApi().getBetStreak();

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('/users/bet-streak');
  });

  it('passa pelo apiClient compartilhado, que é quem injeta o Bearer', async () => {
    mockGet.mockResolvedValue({ data: { betStreak: { days: 1, hours: 0, minutes: 0 } } });

    await new BetStreakApi().getBetStreak();

    // Se a classe montasse o próprio axios, o interceptor de Authorization não
    // rodaria e a requisição sairia anônima.
    expect(mockGet).toHaveBeenCalled();
  });

  it('preserva days, hours e minutes', async () => {
    mockGet.mockResolvedValue({ data: { betStreak: { days: 6, hours: 5, minutes: 28 } } });

    await expect(new BetStreakApi().getBetStreak()).resolves.toEqual({
      days: 6,
      hours: 5,
      minutes: 28,
    });
  });

  it('devolve zero de verdade quando o backend manda zero', async () => {
    mockGet.mockResolvedValue({ data: { betStreak: { days: 0, hours: 0, minutes: 0 } } });

    await expect(new BetStreakApi().getBetStreak()).resolves.toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
    });
  });

  it('traduz 401 em sessão expirada', async () => {
    mockGet.mockRejectedValue(httpError(401));

    await expect(new BetStreakApi().getBetStreak()).rejects.toThrow(
      'Sessão expirada. Faça login novamente.',
    );
  });

  it('lança em erro de rede em vez de devolver contador zerado', async () => {
    mockGet.mockRejectedValue({ code: 'ERR_NETWORK', message: 'Network Error' });

    const promise = new BetStreakApi().getBetStreak();

    await expect(promise).rejects.toBeInstanceOf(AuthenticationError);
    // O ponto do teste: falha nunca vira `{days: 0, ...}`.
    await expect(promise).rejects.toThrow('Erro de conexão. Verifique sua internet.');
  });

  it('lança quando nem a rota nova nem a antiga existem', async () => {
    mockGet.mockRejectedValue(httpError(404));

    await expect(new BetStreakApi().getBetStreak()).rejects.toThrow(
      'Endpoint não encontrado. Verifique a configuração.',
    );
  });
});

/**
 * Enquanto houver ambiente rodando o backend antigo, um 404 na rota nova não
 * pode derrubar a Home. A rota velha entra só como leitura, e só nesse caso.
 */
describe('compatibilidade com o backend antigo', () => {
  const respostaLegada = {
    data: {
      betStreak: { days: 6, hours: 5, minutes: 28 },
      // Vêm na resposta antiga e devem ser ignorados.
      canCheckIn: true,
      nextCheckInAt: '2026-09-06T10:00:00.000Z',
    },
  };

  /**
   * O caso real deste backend: `@Get(':id')` captura /users/bet-streak antes de
   * qualquer rota específica, vira findOne com id não-uuid e o Postgres estoura.
   * Foi o 500 que passou batido quando o fallback só olhava 404.
   */
  it('cai para /users/bet-checkin quando a rota nova responde 500', async () => {
    mockGet
      .mockRejectedValueOnce(httpError(500))
      .mockResolvedValueOnce(respostaLegada);

    await expect(new BetStreakApi().getBetStreak()).resolves.toEqual({
      days: 6,
      hours: 5,
      minutes: 28,
    });

    expect(mockGet.mock.calls.map(([url]) => url)).toEqual([
      '/users/bet-streak',
      '/users/bet-checkin',
    ]);
  });

  it('cai quando a rota nova responde 200 com um usuário em vez do contador', async () => {
    // `:id` capturando a URL e respondendo: status 200, corpo sem betStreak.
    mockGet
      .mockResolvedValueOnce({ data: { id: 'abc', name: 'Teste', email: 'a@b.c' } })
      .mockResolvedValueOnce(respostaLegada);

    await expect(new BetStreakApi().getBetStreak()).resolves.toEqual({
      days: 6,
      hours: 5,
      minutes: 28,
    });

    expect(mockGet.mock.calls.map(([url]) => url)).toEqual([
      '/users/bet-streak',
      '/users/bet-checkin',
    ]);
  });

  it('quando as duas falham, vale a mensagem da rota nova', async () => {
    mockGet
      .mockRejectedValueOnce(httpError(500))
      .mockRejectedValueOnce(httpError(404));

    await expect(new BetStreakApi().getBetStreak()).rejects.toThrow(
      'Erro no servidor. Tente novamente mais tarde.',
    );
  });

  it('cai para /users/bet-checkin quando a rota nova responde 404', async () => {
    mockGet
      .mockRejectedValueOnce(httpError(404))
      .mockResolvedValueOnce(respostaLegada);

    await expect(new BetStreakApi().getBetStreak()).resolves.toEqual({
      days: 6,
      hours: 5,
      minutes: 28,
    });

    expect(mockGet.mock.calls.map(([url]) => url)).toEqual([
      '/users/bet-streak',
      '/users/bet-checkin',
    ]);
  });

  it('descarta canCheckIn e nextCheckInAt da resposta antiga', async () => {
    mockGet
      .mockRejectedValueOnce(httpError(404))
      .mockResolvedValueOnce(respostaLegada);

    const duracao = await new BetStreakApi().getBetStreak();

    expect(Object.keys(duracao).sort()).toEqual(['days', 'hours', 'minutes']);
  });

  it('lembra a rota que funcionou e não repete o 404', async () => {
    mockGet
      .mockRejectedValueOnce(httpError(404))
      .mockResolvedValue(respostaLegada);

    const api = new BetStreakApi();
    await api.getBetStreak();
    await api.getBetStreak();

    expect(mockGet.mock.calls.map(([url]) => url)).toEqual([
      '/users/bet-streak',
      '/users/bet-checkin',
      '/users/bet-checkin',
    ]);
  });

  it('volta para a rota nova se o backend for atualizado na mesma sessão', async () => {
    mockGet
      .mockRejectedValueOnce(httpError(404))
      .mockResolvedValueOnce(respostaLegada);

    const api = new BetStreakApi();
    await api.getBetStreak();

    // Backend atualizado: a rota velha some e a nova passa a responder.
    mockGet.mockReset();
    mockGet
      .mockRejectedValueOnce(httpError(404))
      .mockResolvedValueOnce({ data: { betStreak: { days: 9, hours: 1, minutes: 2 } } });

    await expect(api.getBetStreak()).resolves.toEqual({ days: 9, hours: 1, minutes: 2 });
    expect(mockGet.mock.calls.map(([url]) => url)).toEqual([
      '/users/bet-checkin',
      '/users/bet-streak',
    ]);
  });

  it('não tenta a rota antiga em sessão expirada', async () => {
    mockGet.mockRejectedValue(httpError(401));

    await expect(new BetStreakApi().getBetStreak()).rejects.toThrow('Sessão expirada');

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('/users/bet-streak');
  });

  it('não tenta a rota antiga em erro de rede', async () => {
    mockGet.mockRejectedValue({ code: 'ERR_NETWORK', message: 'Network Error' });

    await expect(new BetStreakApi().getBetStreak()).rejects.toThrow('Erro de conexão');

    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});

describe('BetStreakApi.reset', () => {
  it('posta em /users/bet-reset e devolve success', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });

    await expect(new BetStreakApi().reset()).resolves.toEqual({ success: true });
    expect(mockPost).toHaveBeenCalledWith('/users/bet-reset');
  });

  it('propaga o erro do reset', async () => {
    mockPost.mockRejectedValue(httpError(500));

    await expect(new BetStreakApi().reset()).rejects.toThrow(
      'Erro no servidor. Tente novamente mais tarde.',
    );
  });
});

describe('rotas removidas', () => {
  it('não expõe mais checkIn', () => {
    expect((new BetStreakApi() as any).checkIn).toBeUndefined();
  });

  it('não toca na rota antiga quando a nova responde', async () => {
    mockGet.mockResolvedValue({ data: { betStreak: { days: 3, hours: 0, minutes: 0 } } });
    mockPost.mockResolvedValue({ data: { success: true } });

    const api = new BetStreakApi();
    await api.getBetStreak();
    await api.reset();

    const urls = [...mockGet.mock.calls, ...mockPost.mock.calls].map(([url]) => url);
    expect(urls).not.toContain('/users/bet-checkin');
  });

  it('nunca escreve na rota antiga, nem no modo de compatibilidade', async () => {
    mockGet
      .mockRejectedValueOnce({ response: { status: 404 }, message: 'HTTP 404' })
      .mockResolvedValue({ data: { betStreak: { days: 3, hours: 0, minutes: 0 } } });
    mockPost.mockResolvedValue({ data: { success: true } });

    const api = new BetStreakApi();
    await api.getBetStreak();
    await api.reset();

    // O check-in era um POST; nenhuma escrita pode ir para lá.
    expect(mockPost.mock.calls.map(([url]) => url)).toEqual(['/users/bet-reset']);
  });
});

describe('parseBetStreak', () => {
  it('normaliza lixo para zero sem quebrar', () => {
    expect(parseBetStreak(undefined)).toEqual({ days: 0, hours: 0, minutes: 0 });
    expect(parseBetStreak({ days: -3, hours: '5', minutes: null })).toEqual({
      days: 0,
      hours: 5,
      minutes: 0,
    });
  });

  it('aceita o formato antigo de número puro como dias', () => {
    expect(parseBetStreak(9)).toEqual({ days: 9, hours: 0, minutes: 0 });
  });
});

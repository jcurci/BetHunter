import { apiClient } from '../../services/api/apiClient';
import {
  BetStreakDuration,
  ZERO_BET_STREAK_DURATION,
} from '../../domain/entities/BetStreakDuration';
import { AuthenticationError } from '../../domain/errors/CustomErrors';

/** Inteiro >= 0, ou 0 se o backend mandar null/string/lixo. */
function toCount(value: any): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
}

/**
 * Normaliza o `betStreak` da API para `{ days, hours, minutes }`.
 *
 * O contrato atual devolve o objeto. O ramo do número puro é o formato antigo e
 * fica como rede de proteção: um app apontado para um ambiente ainda não
 * atualizado mostra os dias que vieram em vez de zerar a Home.
 */
export function parseBetStreak(raw: any): BetStreakDuration {
  // Formato legado: dias como número puro (ou string numérica).
  if (typeof raw === 'number' || typeof raw === 'string') {
    return { ...ZERO_BET_STREAK_DURATION, days: toCount(raw) };
  }

  if (raw && typeof raw === 'object') {
    return {
      days: toCount(raw.days),
      hours: toCount(raw.hours),
      minutes: toCount(raw.minutes),
    };
  }

  return { ...ZERO_BET_STREAK_DURATION };
}

/**
 * Converte o erro do axios na mensagem que a tela mostra. Nunca devolve — sempre
 * lança. Ficava duplicado em cada método; o mapeamento é o mesmo, só a frase
 * final muda.
 *
 * Um erro aqui nunca vira "0 dias": quem chama propaga a exceção e a tela
 * mantém o último valor conhecido.
 */
function throwBetStreakError(error: any, acao: string): never {
  console.error(`🚨 BetStreakApi.${acao} - Erro detalhado:`, {
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    code: error.code,
    isNetworkError: !error.response,
  });

  if (error instanceof AuthenticationError) {
    throw error;
  }

  // Erros de rede (sem resposta do servidor)
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new AuthenticationError('Timeout. O servidor demorou muito para responder.');
    }
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
      throw new AuthenticationError('Erro de conexão. Verifique sua internet.');
    }
    throw new AuthenticationError('Não foi possível conectar ao servidor. Verifique sua conexão.');
  }

  if (error.response.status === 401) {
    throw new AuthenticationError('Sessão expirada. Faça login novamente.');
  }
  if (error.response.status === 404) {
    throw new AuthenticationError('Endpoint não encontrado. Verifique a configuração.');
  }
  if (error.response.status === 500) {
    throw new AuthenticationError('Erro no servidor. Tente novamente mais tarde.');
  }

  throw new AuthenticationError(`Erro ao ${acao} (${error.response.status}). Tente novamente.`);
}

const ROTA_ATUAL = '/users/bet-streak';
/**
 * Rota do modelo antigo, de check-in diário. Continua aqui **só como leitura de
 * emergência**: enquanto houver ambiente rodando o backend velho, a rota nova
 * falha e a Home ficaria sem contador.
 *
 * Dela aproveitamos exclusivamente o `betStreak`. `canCheckIn` e `nextCheckInAt`
 * vêm na resposta e são descartados de propósito — o app não tem mais bloqueio
 * de 24h, botão de confirmação diária nem contador próprio.
 *
 * Atenção à semântica: no backend velho esse número vem de `bet_streak`, um
 * inteiro que subia a cada check-in, e não de `bet_free_since_at`. É uma
 * aproximação para o app não quebrar, não uma equivalência.
 */
const ROTA_LEGADA = '/users/bet-checkin';

/**
 * O backend antigo **não** devolve 404 em `/users/bet-streak`.
 *
 * O `@Get(':id')` do controller está declarado antes de qualquer rota que
 * pudesse tratar `bet-streak`, então a URL casa com `:id` e vira
 * `findOne({ where: { id: 'bet-streak' } })` numa coluna uuid do Postgres — o
 * que estoura como **500**. Por isso a decisão não pode olhar só o 404.
 *
 * A regra é por exclusão: qualquer status HTTP justifica tentar a rota antiga,
 * menos os dois casos em que repetir não resolveria nada.
 */
function devoTentarRotaLegada(error: any): boolean {
  // Sem resposta = timeout ou queda de rede. Offline é offline nas duas rotas.
  if (!error?.response) return false;
  // Sessão expirada: a rota antiga daria 401 igual, e a segunda requisição
  // ainda atrasaria o logout automático que o apiClient dispara no 401.
  if (error.response.status === 401) return false;
  return true;
}

/**
 * A resposta realmente veio do endpoint do contador?
 *
 * Não basta o status 200. Se `:id` capturar a URL e por acaso responder, o corpo
 * é um `UserResponse` — sem `betStreak`. Como `parseBetStreak` transforma
 * qualquer entrada inválida em `{0,0,0}`, sem esta checagem o app leria um
 * usuário como se fosse duração e desenharia zero dia com toda a confiança.
 */
function pareceBetStreak(data: any): boolean {
  const raw = data?.betStreak;
  if (typeof raw === 'number' || typeof raw === 'string') return Number.isFinite(Number(raw));
  if (!raw || typeof raw !== 'object') return false;
  return ['days', 'hours', 'minutes'].some((campo) => Number.isFinite(Number(raw[campo])));
}

/** Erro sintético para o 200 que chegou do endpoint errado. */
class RespostaInesperadaError extends Error {
  response = { status: 200 };
  constructor(url: string) {
    super(`Resposta de ${url} não tem betStreak`);
  }
}

export class BetStreakApi {
  /**
   * Qual das duas rotas este backend atende, descoberto na primeira consulta.
   *
   * Sem isso toda consulta pagaria a tentativa perdida antes de acertar. O
   * Container mantém uma instância só, então a descoberta vale para a sessão
   * inteira; uma falha na rota lembrada limpa o palpite e refaz a busca, para o
   * app não ficar preso à rota velha quando o backend for atualizado.
   */
  private rotaConhecida: string | null = null;

  private async consultar(url: string): Promise<BetStreakDuration> {
    console.log('🔗 BetStreakApi.getBetStreak - Fazendo requisição GET para:', url);
    const response = await apiClient.get(url);

    if (!pareceBetStreak(response.data)) {
      throw new RespostaInesperadaError(url);
    }

    return parseBetStreak(response.data.betStreak);
  }

  /**
   * Duração já calculada pelo backend a partir de `bet_free_since_at`.
   *
   * O backend é a fonte do tempo acumulado — o app só lê. Não existe timestamp
   * de início na resposta, então não há como (nem por que) recalcular aqui.
   */
  async getBetStreak(): Promise<BetStreakDuration> {
    try {
      if (this.rotaConhecida) {
        try {
          return await this.consultar(this.rotaConhecida);
        } catch (error: any) {
          if (!devoTentarRotaLegada(error)) throw error;
          // O backend mudou debaixo da sessão: esquece e descobre de novo.
          this.rotaConhecida = null;
        }
      }

      try {
        const duracao = await this.consultar(ROTA_ATUAL);
        this.rotaConhecida = ROTA_ATUAL;
        return duracao;
      } catch (error: any) {
        if (!devoTentarRotaLegada(error)) throw error;

        console.warn(
          '⚠️ BetStreakApi - ' + ROTA_ATUAL + ' não respondeu como esperado; usando ' + ROTA_LEGADA,
        );

        try {
          const duracao = await this.consultar(ROTA_LEGADA);
          this.rotaConhecida = ROTA_LEGADA;
          return duracao;
        } catch {
          // As duas falharam: vale a mensagem da rota que o app deveria usar.
          throw error;
        }
      }
    } catch (error: any) {
      throwBetStreakError(error, 'consultar streak');
    }
  }

  /** "Apostei": zera o contador. Única escrita que o app faz no contador. */
  async reset(): Promise<{ success: boolean }> {
    try {
      const url = '/users/bet-reset';
      console.log('🔗 BetStreakApi.reset - Fazendo requisição POST para:', url);

      const response = await apiClient.post(url);

      return {
        success: response.data.success,
      };
    } catch (error: any) {
      throwBetStreakError(error, 'resetar streak');
    }
  }
}

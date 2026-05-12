import { apiClient } from '../../services/api/apiClient';
import { ClaimRewardResult } from '../../domain/entities/RewardClaim';
import { AuthenticationError, ServerError } from '../../domain/errors/CustomErrors';

export class RewardApi {
  async claimReward(rewardModuleId: string): Promise<ClaimRewardResult> {
    const path = `/rewards/claim/${rewardModuleId}`;
    if (__DEV__) {
      console.warn('[BetHunter] claimReward → enviando POST', { path, rewardModuleId });
    }
    try {
      const response = await apiClient.post<ClaimRewardResult>(path, {});
      if (__DEV__) {
        console.warn('[BetHunter] claimReward ← servidor respondeu OK', {
          path,
          httpStatus: response.status,
          corpoServidor: response.data,
        });
      }
      return { energyReceived: response.data.energyReceived ?? 0 };
    } catch (error: any) {
      if (error instanceof AuthenticationError || error instanceof ServerError) {
        throw error;
      }
      if (__DEV__) {
        console.warn('[BetHunter] claimReward ← ERRO', {
          path,
          rewardModuleId,
          httpStatus: error?.response?.status,
          corpoServidor: error?.response?.data,
          axiosMessage: error?.message,
        });
      }
      if (!error.response) {
        throw new AuthenticationError(
          'Não foi possível conectar ao servidor. Verifique sua conexão.',
        );
      }
      if (error.response.status === 401) {
        throw new AuthenticationError('Token inválido ou expirado. Faça login novamente.');
      }
      if (error.response.status === 400) {
        const msg = error.response?.data?.message ?? 'Recompensa indisponível.';
        throw new ServerError(typeof msg === 'string' ? msg : 'Recompensa indisponível.');
      }
      if (error.response.status === 404) {
        throw new ServerError('Módulo de recompensa não encontrado.');
      }
      throw new ServerError('Erro ao coletar recompensa. Tente novamente.');
    }
  }
}

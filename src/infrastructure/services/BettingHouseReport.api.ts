import { apiClient } from '../../services/api/apiClient';
import type { BettingHouseReportPayload } from '../../domain/repositories/BettingHouseReportRepository';
import { AuthenticationError } from '../../domain/errors/CustomErrors';

export class BettingHouseReportApi {
  async submitReport(payload: BettingHouseReportPayload): Promise<void> {
    try {
      await apiClient.post('/betting-links', { url: payload.url });
    } catch (error: any) {
      if (error instanceof AuthenticationError) {
        throw error;
      }

      if (!error.response) {
        throw new Error(
          'Não foi possível enviar. Verifique sua conexão e tente novamente.',
        );
      }

      if (error.response.status === 401) {
        throw new AuthenticationError('Sessão expirada. Faça login novamente.');
      }

      const message =
        error.response?.data?.message ??
        error.response?.data?.error ??
        'Não foi possível enviar a denúncia. Tente novamente mais tarde.';
      throw new Error(String(message));
    }
  }
}

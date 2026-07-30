import { apiClient } from '../../services/api/apiClient';
import type { AcquisitionSourcePayload } from '../../domain/repositories/AcquisitionSourceRepository';
import { AuthenticationError } from '../../domain/errors/CustomErrors';

export class AcquisitionSourceApi {
  async submit(payload: AcquisitionSourcePayload): Promise<void> {
    try {
      // Spreads condicionais: o ValidationPipe do backend usa
      // forbidNonWhitelisted, e mandar `sourceOther: null` seria campo extra.
      await apiClient.post('/acquisition-sources', {
        source: payload.source,
        ...(payload.sourceOther ? { sourceOther: payload.sourceOther } : {}),
        ...(payload.platform ? { platform: payload.platform } : {}),
        ...(payload.appVersion ? { appVersion: payload.appVersion } : {}),
      });
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
        'Não foi possível registrar a origem. Tente novamente mais tarde.';
      throw new Error(String(message));
    }
  }
}

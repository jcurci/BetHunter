import { apiClient } from '../../services/api/apiClient';
import { ENV } from '../../config/env';
import {
  CompleteModuleResult,
  SubmitQuizAnswerPayload,
  SubmitQuizModuleResult,
} from '../../domain/entities/ModuleSubmission';
import { AuthenticationError, ServerError } from '../../domain/errors/CustomErrors';

export class ModuleCourseProgressApi {
  async submitQuizModule(
    moduleId: string,
    answers: SubmitQuizAnswerPayload[],
  ): Promise<SubmitQuizModuleResult> {
    const path = `/modules/${moduleId}/submit`;
    const urlCompleta = `${ENV.API_BASE_URL.replace(/\/$/, '')}${path}`;

    try {
      if (__DEV__) {
        console.warn('[BetHunter] Quiz submit → enviando POST', {
          urlCompleta,
          moduleId,
          respostas: answers.length,
        });
      }

      const response = await apiClient.post<SubmitQuizModuleResult>(
        path,
        { answers },
      );
      const d = response.data;
      const out = {
        stars: d.stars ?? 0,
        accuracy: d.accuracy ?? 0,
        correctCount: d.correctCount ?? 0,
        totalQuestions: d.totalQuestions ?? answers.length,
      };
      if (__DEV__) {
        console.warn('[BetHunter] Quiz submit ← servidor respondeu OK', {
          urlCompleta,
          httpStatus: response.status,
          corpoServidor: response.data,
          usandoNaApp: out,
        });
      }
      return out;
    } catch (error: any) {
      if (error instanceof AuthenticationError || error instanceof ServerError) {
        throw error;
      }
      if (__DEV__) {
        const res = error?.response;
        console.warn('[BetHunter] Quiz submit ← servidor ERRO', {
          urlCompleta,
          moduleId,
          answersCount: answers?.length ?? 0,
          httpStatus: res?.status,
          corpoServidor: res?.data,
          axiosMessage: error?.message,
          code: error?.code,
        });
      }
      if (!error.response) {
        throw new AuthenticationError(
          'Não foi possível conectar ao servidor. Verifique sua conexão.',
        );
      }
      if (error.response.status === 400) {
        const msg = error.response?.data?.message;
        const detail = Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Dados inválidos.');
        throw new ServerError(`Erro de validação: ${detail}`);
      }
      if (error.response.status === 401) {
        throw new AuthenticationError('Token inválido ou expirado. Faça login novamente.');
      }
      if (error.response.status === 403) {
        const msg =
          error.response?.data?.message ??
          'Energia insuficiente para submeter este módulo.';
        throw new ServerError(typeof msg === 'string' ? msg : 'Sem energia disponível.');
      }
      if (error.response.status === 409) {
        const msg = error.response?.data?.message ?? 'Este módulo já foi concluído.';
        throw new ServerError(typeof msg === 'string' ? msg : 'Módulo já concluído.');
      }
      throw new ServerError('Erro ao submeter o quiz. Tente novamente.');
    }
  }

  async completeNonQuizModule(moduleId: string): Promise<CompleteModuleResult> {
    const path = `/module-material/complete/${moduleId}`;
    if (__DEV__) {
      console.warn('[BetHunter] completeNonQuizModule → POST', path);
    }
    try {
      const response = await apiClient.post<CompleteModuleResult>(path, {});
      const d = response.data;
      return {
        completed: d.completed === true,
        starsEarned: d.starsEarned ?? 0,
      };
    } catch (error: any) {
      if (error instanceof AuthenticationError || error instanceof ServerError) {
        throw error;
      }
      if (!error.response) {
        throw new AuthenticationError(
          'Não foi possível conectar ao servidor. Verifique sua conexão.',
        );
      }
      if (__DEV__) {
        console.warn('[BetHunter] completeNonQuizModule ← ERRO', {
          path,
          moduleId,
          httpStatus: error?.response?.status,
          corpoServidor: error?.response?.data,
          axiosMessage: error?.message,
        });
      }
      if (error.response.status === 401) {
        throw new AuthenticationError('Token inválido ou expirado. Faça login novamente.');
      }
      if (error.response.status === 403) {
        const msg = error.response?.data?.message ?? 'Você precisa completar os módulos anteriores primeiro.';
        throw new ServerError(typeof msg === 'string' ? msg : 'Módulo bloqueado.');
      }
      if (error.response.status === 409) {
        const msg = error.response?.data?.message ?? 'Este módulo já foi concluído.';
        throw new ServerError(typeof msg === 'string' ? msg : 'Módulo já concluído.');
      }
      throw new ServerError('Erro ao concluir o módulo. Tente novamente.');
    }
  }
}

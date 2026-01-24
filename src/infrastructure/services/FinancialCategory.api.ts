import { apiClient } from '../../services/api/apiClient';
import { FinancialCategoryApiResponse, mapCategoryFromApi, FinancialCategory } from '../../domain/entities/FinancialCategory';
import { AuthenticationError } from '../../domain/errors/CustomErrors';

export class FinancialCategoryApi {
  async findAll(): Promise<FinancialCategory[]> {
    try {
      const url = '/financial_categories';
      console.log('🔗 FinancialCategoryApi.findAll - Fazendo requisição para:', url);

      const response = await apiClient.get<FinancialCategoryApiResponse[]>(url);

      console.log('✅ FinancialCategoryApi.findAll - Categorias recebidas:', response.data.length);

      return response.data.map(mapCategoryFromApi);
    } catch (error: any) {
      console.error('🚨 FinancialCategoryApi.findAll - Erro detalhado:', {
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

      // Erros HTTP específicos
      if (error.response.status === 401) {
        throw new AuthenticationError('Token inválido ou expirado. Faça login novamente.');
      }
      if (error.response.status === 404) {
        throw new AuthenticationError('Endpoint não encontrado. Verifique a configuração.');
      }
      if (error.response.status === 500) {
        throw new AuthenticationError('Erro no servidor. Tente novamente mais tarde.');
      }

      throw new AuthenticationError(`Erro ao buscar categorias (${error.response.status}). Tente novamente.`);
    }
  }
}

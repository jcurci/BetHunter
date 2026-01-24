import { apiClient } from '../../services/api/apiClient';
import { 
  FinancialEntry, 
  FinancialEntryApiResponse, 
  CreateFinancialEntryRequest, 
  FinancialEntryFilters,
  mapEntryFromApi 
} from '../../domain/entities/FinancialEntry';
import { AuthenticationError } from '../../domain/errors/CustomErrors';

export class FinancialEntryApi {
  async findAll(filters?: FinancialEntryFilters): Promise<FinancialEntry[]> {
    try {
      let url = '/financial_entries';
      
      // Se há filtros, usar o endpoint /filter
      if (filters && (filters.start_date || filters.end_date || filters.type || filters.category_id)) {
        url = '/financial_entries/filter';
        const params = new URLSearchParams();
        
        if (filters.start_date) {
          params.append('start_date', filters.start_date);
        }
        if (filters.end_date) {
          params.append('end_date', filters.end_date);
        }
        if (filters.type) {
          params.append('type', filters.type);
        }
        if (filters.category_id) {
          params.append('category_id', filters.category_id);
        }
        
        url = `${url}?${params.toString()}`;
      }

      console.log('🔗 FinancialEntryApi.findAll - Fazendo requisição para:', url);

      const response = await apiClient.get<FinancialEntryApiResponse[]>(url);

      console.log('✅ FinancialEntryApi.findAll - Entradas recebidas:', response.data.length);

      return response.data.map(mapEntryFromApi);
    } catch (error: any) {
      console.error('🚨 FinancialEntryApi.findAll - Erro detalhado:', {
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

      throw new AuthenticationError(`Erro ao buscar transações (${error.response.status}). Tente novamente.`);
    }
  }

  async create(request: CreateFinancialEntryRequest): Promise<FinancialEntry> {
    try {
      const url = '/financial_entries';
      console.log('🔗 FinancialEntryApi.create - Fazendo requisição para:', url);
      console.log('📦 FinancialEntryApi.create - Dados:', request);

      const response = await apiClient.post<FinancialEntryApiResponse>(url, {
        category_id: request.category_id,
        balance: request.balance,
        description: request.description,
        created_at: request.created_at.toISOString().split('T')[0], // Formato YYYY-MM-DD
      });

      console.log('✅ FinancialEntryApi.create - Entrada criada:', response.data);

      return mapEntryFromApi(response.data);
    } catch (error: any) {
      console.error('🚨 FinancialEntryApi.create - Erro detalhado:', {
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
      if (error.response.status === 400) {
        const message = error.response.data?.message || 'Dados inválidos';
        throw new AuthenticationError(`Erro: ${message}`);
      }
      if (error.response.status === 401) {
        throw new AuthenticationError('Token inválido ou expirado. Faça login novamente.');
      }
      if (error.response.status === 404) {
        throw new AuthenticationError('Categoria não encontrada. Selecione outra categoria.');
      }
      if (error.response.status === 500) {
        throw new AuthenticationError('Erro no servidor. Tente novamente mais tarde.');
      }

      throw new AuthenticationError(`Erro ao criar transação (${error.response.status}). Tente novamente.`);
    }
  }
}

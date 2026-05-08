import { TransactionType, mapApiTypeToFrontend, mapFrontendTypeToApi } from './FinancialCategory';

export interface FinancialEntry {
  id: string;
  valor: string;
  descricao: string;
  data: Date;
  tipo: 'entrada' | 'saida';
  categoria: { id: string; nome: string; icone?: string } | null;
  createdAt: string;
}

// Request para criar uma entrada financeira
export interface CreateFinancialEntryRequest {
  categoryId: string;
  type: TransactionType;
  balance: number;
  description: string;
  createdAt: Date;
}

// Resposta da API (espelha FinancialEntryResponseDto do NestJS)
export interface FinancialEntryApiResponse {
  id: string;
  userId: string;
  categoryId: string;
  type: TransactionType;
  category: { iconSrc: string; description: string } | null;
  balance: number;
  description: string;
  createdAt: string;
}

// Filtros para buscar entradas
export interface FinancialEntryFilters {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  categoryId?: string;
}

// Mapper de resposta da API para entidade do frontend
export const mapEntryFromApi = (apiResponse: FinancialEntryApiResponse): FinancialEntry => {
  return {
    id: apiResponse.id,
    valor: apiResponse.balance.toString(),
    descricao: apiResponse.description || '',
    data: new Date(apiResponse.createdAt),
    tipo: mapApiTypeToFrontend(apiResponse.type),
    categoria: apiResponse.category
      ? {
          id: apiResponse.categoryId,
          nome: apiResponse.category.description,
          icone: apiResponse.category.iconSrc,
        }
      : null,
    createdAt: apiResponse.createdAt,
  };
};

// Mapper de request do frontend para API
export const mapEntryToApi = (
  valor: string,
  descricao: string,
  data: Date,
  categoryId: string,
  tipo: 'entrada' | 'saida',
): CreateFinancialEntryRequest => {
  return {
    categoryId,
    type: mapFrontendTypeToApi(tipo),
    balance: parseFloat(valor) || 0,
    description: descricao,
    createdAt: data,
  };
};

import { TransactionType, mapApiTypeToFrontend } from './FinancialCategory';

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
  category_id: string;
  balance: number;
  description: string;
  created_at: Date;
}

// Resposta da API
export interface FinancialEntryApiResponse {
  id: string;
  user_id: string;
  category_id: string;
  category_type: TransactionType;
  category_icon_src: string;
  category_description: string;
  balance: number;
  description: string;
  created_at: string;
}

// Filtros para buscar entradas
export interface FinancialEntryFilters {
  start_date?: string;
  end_date?: string;
  type?: TransactionType;
  category_id?: string;
}

// Mapper de resposta da API para entidade do frontend
export const mapEntryFromApi = (apiResponse: FinancialEntryApiResponse): FinancialEntry => {
  return {
    id: apiResponse.id,
    valor: apiResponse.balance.toString(),
    descricao: apiResponse.description || '',
    data: new Date(apiResponse.created_at),
    tipo: mapApiTypeToFrontend(apiResponse.category_type),
    categoria: {
      id: apiResponse.category_id,
      nome: apiResponse.category_description,
      icone: apiResponse.category_icon_src,
    },
    createdAt: apiResponse.created_at,
  };
};

// Mapper de request do frontend para API
export const mapEntryToApi = (
  valor: string,
  descricao: string,
  data: Date,
  categoryId: string
): CreateFinancialEntryRequest => {
  return {
    category_id: categoryId,
    balance: parseFloat(valor) || 0,
    description: descricao,
    created_at: data,
  };
};

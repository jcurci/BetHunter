export interface FinancialCategory {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'entrada' | 'saida';
  icone: string;
}

// Tipo usado pela API
export type TransactionType = 'INCOME' | 'EXPENSE';

// Resposta da API
export interface FinancialCategoryApiResponse {
  id: string;
  type: TransactionType;
  description: string;
  icon_src: string;
}

// Mapeamento de tipos API <-> Frontend
export const mapApiTypeToFrontend = (type: TransactionType): 'entrada' | 'saida' => {
  return type === 'INCOME' ? 'entrada' : 'saida';
};

export const mapFrontendTypeToApi = (tipo: 'entrada' | 'saida'): TransactionType => {
  return tipo === 'entrada' ? 'INCOME' : 'EXPENSE';
};

// Mapper de resposta da API para entidade do frontend
export const mapCategoryFromApi = (apiResponse: FinancialCategoryApiResponse): FinancialCategory => {
  return {
    id: apiResponse.id,
    nome: apiResponse.description,
    descricao: apiResponse.description,
    tipo: mapApiTypeToFrontend(apiResponse.type),
    icone: apiResponse.icon_src,
  };
};

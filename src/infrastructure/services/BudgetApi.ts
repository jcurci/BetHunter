import { apiClient } from '../../services/api/apiClient';

export interface BudgetApiResponse {
  id: string;
  month: number;
  year: number;
  limit: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  isActive: boolean;
  finalBalance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetExpenseApiResponse {
  id: string;
  financialEntryId: string;
  amount: number;
  category: string;
  categoryId: string;
  description: string;
  expenseDate: string;
  createdAt: string;
}

export interface BudgetHistoryItemApiResponse {
  id: string;
  month: number;
  year: number;
  monthYear: string;
  limit: number;
  spent: number;
  finalBalance: number;
  createdAt: string;
}

export interface InactivityApiResponse {
  hasInactivity: boolean;
  daysSinceLastExpense: number;
}

export interface AddExpenseApiDto {
  categoryId: string;
  amount: number;
  description?: string;
  expenseDate?: string;
}

export class BudgetApi {
  async getCurrentBudget(): Promise<BudgetApiResponse | null> {
    const response = await apiClient.get('/budget');
    return response.data ?? null;
  }

  async createBudget(limit: number, month: number, year: number): Promise<BudgetApiResponse> {
    const response = await apiClient.post('/budget', { limit, month, year });
    return response.data;
  }

  async updateBudget(limit: number): Promise<BudgetApiResponse> {
    const response = await apiClient.put('/budget', { limit });
    return response.data;
  }

  async addExpense(dto: AddExpenseApiDto): Promise<BudgetExpenseApiResponse> {
    const response = await apiClient.post('/budget/expenses', dto);
    return response.data;
  }

  async getExpenses(): Promise<BudgetExpenseApiResponse[]> {
    const response = await apiClient.get('/budget/expenses');
    return response.data ?? [];
  }

  async getHistory(): Promise<BudgetHistoryItemApiResponse[]> {
    const response = await apiClient.get('/budget/history');
    return response.data ?? [];
  }

  async getPreviousMonthExpenses(budgetId: string): Promise<BudgetExpenseApiResponse[]> {
    const response = await apiClient.get(`/budget/history/${budgetId}/expenses`);
    return response.data ?? [];
  }

  async checkInactivity(): Promise<InactivityApiResponse> {
    const response = await apiClient.get('/budget/inactivity');
    return response.data;
  }
}

import {
  Budget,
  BudgetExpenseSnapshot,
  BudgetPeriodSummary,
} from '../entities/Budget';

export interface BudgetRepository {
  /** Orçamento do mês informado (default: mês corrente). */
  getCurrentBudget(periodKey?: string): Promise<Budget | null>;

  /** Cria ou atualiza o orçamento do mês corrente. */
  setCurrentBudget(value: number, periodKey?: string): Promise<Budget>;

  /** Lista os meses anteriores em ordem cronológica reversa. */
  getHistory(): Promise<BudgetPeriodSummary[]>;

  /** Gastos do período informado (current → GET /budget/expenses; histórico → GET /budget/history/:id/expenses). */
  getExpensesForPeriod(periodKey: string): Promise<BudgetExpenseSnapshot[]>;

  /** Resumo (orçamento + total gasto + saldo) do período corrente ou informado. */
  getPeriodSummary(periodKey?: string): Promise<BudgetPeriodSummary | null>;

  /** Registra um gasto no orçamento ativo via POST /budget/expenses. */
  addExpense(input: {
    categoryId: string;
    amount: number;
    description?: string;
    expenseDate: Date;
  }): Promise<BudgetExpenseSnapshot>;

  /** Número de dias desde o último gasto registrado pelo usuário. */
  getDaysSinceLastEntry(): Promise<number>;

  /** Marca que o usuário dispensou o banner de ausência (persistido em AsyncStorage). */
  markBannerDismissed(): Promise<void>;

  /** Indica se o banner foi dispensado nos últimos 7 dias. */
  wasBannerDismissedRecently(): Promise<boolean>;
}

import {
  Budget,
  BudgetExpenseSnapshot,
  BudgetPeriodSummary,
} from '../entities/Budget';

/**
 * Contrato do repositório do Modo Orçamento.
 * A implementação atual é mock em memória; ver BudgetRepositoryImpl.
 */
export interface BudgetRepository {
  /** Orçamento do mês informado (default: mês corrente). */
  getCurrentBudget(periodKey?: string): Promise<Budget | null>;

  /** Cria ou atualiza o orçamento do mês corrente. */
  setCurrentBudget(value: number, periodKey?: string): Promise<Budget>;

  /** Lista os meses anteriores em ordem cronológica reversa. */
  getHistory(): Promise<BudgetPeriodSummary[]>;

  /** Gastos lançados via Modo Orçamento em um período específico. */
  getExpensesForPeriod(periodKey: string): Promise<BudgetExpenseSnapshot[]>;

  /** Resumo (orçamento + total gasto + saldo) do período corrente ou informado. */
  getPeriodSummary(periodKey?: string): Promise<BudgetPeriodSummary | null>;

  /** Adiciona uma cópia local do gasto. O lançamento real vai pela API. */
  appendExpenseSnapshot(
    snapshot: Omit<BudgetExpenseSnapshot, 'id'>,
  ): Promise<BudgetExpenseSnapshot>;

  /** Número de dias desde o último gasto registrado pelo usuário. */
  getDaysSinceLastEntry(): Promise<number>;

  /** Marca que o usuário dispensou o banner de ausência. */
  markBannerDismissed(): Promise<void>;

  /** Indica se o banner foi dispensado nos últimos 7 dias. */
  wasBannerDismissedRecently(): Promise<boolean>;
}

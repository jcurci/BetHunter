/**
 * Domínio: Modo Orçamento.
 *
 * `periodKey` segue o formato 'YYYY-MM' (mês cheio do ano civil).
 * Toda persistência atual é mock (ver BudgetRepositoryImpl).
 */

export interface Budget {
  id: string;
  periodKey: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Espelho local do que foi lançado pelo Modo Orçamento.
 * O lançamento real é gravado no backend via CreateFinancialEntryUseCase;
 * essa cópia existe apenas para alimentar a UI enquanto o mock vigora.
 */
export interface BudgetExpenseSnapshot {
  id: string;
  periodKey: string;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  value: number;
  description: string;
  date: string;
}

export interface BudgetPeriodSummary {
  periodKey: string;
  budgetValue: number;
  totalSpent: number;
  balance: number;
}

/** Gera periodKey 'YYYY-MM' a partir de uma Date. */
export function periodKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Rótulo amigável em pt-BR a partir do periodKey 'YYYY-MM'. */
export function formatPeriodLabel(periodKey: string): string {
  const [yearStr, monthStr] = periodKey.split('-');
  const monthIndex = Number(monthStr) - 1;
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  if (monthIndex < 0 || monthIndex > 11) return periodKey;
  return `${meses[monthIndex]} de ${yearStr}`;
}

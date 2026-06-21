import { BudgetRepository } from '../../repositories/BudgetRepository';
import { BudgetExpenseSnapshot, BudgetPeriodSummary } from '../../entities/Budget';

export interface BudgetPeriodSnapshot {
  summary: BudgetPeriodSummary | null;
  expenses: BudgetExpenseSnapshot[];
}

export class GetBudgetPeriodExpensesUseCase {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(periodKey?: string): Promise<BudgetPeriodSnapshot> {
    const [summary, expenses] = await Promise.all([
      this.budgetRepository.getPeriodSummary(periodKey),
      this.budgetRepository.getExpensesForPeriod(
        periodKey ?? (await defaultPeriodKey()),
      ),
    ]);
    return { summary, expenses };
  }
}

async function defaultPeriodKey(): Promise<string> {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

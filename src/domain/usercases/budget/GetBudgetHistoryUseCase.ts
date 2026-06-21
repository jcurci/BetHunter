import { BudgetRepository } from '../../repositories/BudgetRepository';
import { BudgetPeriodSummary } from '../../entities/Budget';

export class GetBudgetHistoryUseCase {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(): Promise<BudgetPeriodSummary[]> {
    return this.budgetRepository.getHistory();
  }
}

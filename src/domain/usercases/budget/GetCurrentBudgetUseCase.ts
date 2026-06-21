import { BudgetRepository } from '../../repositories/BudgetRepository';
import { Budget } from '../../entities/Budget';

export class GetCurrentBudgetUseCase {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(periodKey?: string): Promise<Budget | null> {
    return this.budgetRepository.getCurrentBudget(periodKey);
  }
}

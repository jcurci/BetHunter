import { BudgetRepository } from '../../repositories/BudgetRepository';
import { Budget } from '../../entities/Budget';
import { ValidationError } from '../../errors/CustomErrors';

export class SetCurrentBudgetUseCase {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(rawValue: string, periodKey?: string): Promise<Budget> {
    if (rawValue == null || rawValue.toString().trim() === '') {
      throw new ValidationError('Informe o valor do orçamento');
    }

    const normalized = rawValue
      .toString()
      .replace(/\./g, '')
      .replace(',', '.');
    const value = parseFloat(normalized);

    if (isNaN(value) || value <= 0) {
      throw new ValidationError('O orçamento deve ser um valor positivo');
    }

    return this.budgetRepository.setCurrentBudget(value, periodKey);
  }
}

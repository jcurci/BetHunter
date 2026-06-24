import { BudgetRepository } from '../../repositories/BudgetRepository';
import { BudgetExpenseSnapshot, periodKeyFromDate } from '../../entities/Budget';

export interface RegisterBudgetExpenseInput {
  valor: string;
  descricao: string;
  data: Date;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
}

export class RegisterBudgetExpenseUseCase {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(input: RegisterBudgetExpenseInput): Promise<BudgetExpenseSnapshot> {
    const normalized = input.valor
      .toString()
      .replace(/\./g, '')
      .replace(',', '.');
    const amount = parseFloat(normalized);

    if (isNaN(amount) || amount <= 0) {
      throw new Error('Valor inválido para o gasto.');
    }

    const snapshot = await this.budgetRepository.addExpense({
      categoryId: input.categoryId,
      amount,
      description: input.descricao || undefined,
      expenseDate: input.data,
    });

    // Enrich snapshot with icon data from local input (not returned by API)
    return {
      ...snapshot,
      categoryName: snapshot.categoryName || input.categoryName,
      categoryIcon: input.categoryIcon,
    };
  }
}

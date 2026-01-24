import { FinancialCategoryRepository } from '../repositories/FinancialCategoryRepository';
import { FinancialCategory } from '../entities/FinancialCategory';

export class GetFinancialCategoriesUseCase {
  constructor(private financialCategoryRepository: FinancialCategoryRepository) {}

  async execute(): Promise<FinancialCategory[]> {
    return this.financialCategoryRepository.findAll();
  }
}

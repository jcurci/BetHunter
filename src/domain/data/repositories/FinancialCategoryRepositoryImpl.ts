import { FinancialCategoryRepository } from '../../repositories/FinancialCategoryRepository';
import { FinancialCategory } from '../../entities/FinancialCategory';
import { FinancialCategoryApi } from '../../../infrastructure/services/FinancialCategory.api';

export class FinancialCategoryRepositoryImpl implements FinancialCategoryRepository {
  constructor(private financialCategoryApi: FinancialCategoryApi) {}

  async findAll(): Promise<FinancialCategory[]> {
    return await this.financialCategoryApi.findAll();
  }
}

import { FinancialCategory } from '../entities/FinancialCategory';

export interface FinancialCategoryRepository {
  findAll(): Promise<FinancialCategory[]>;
}

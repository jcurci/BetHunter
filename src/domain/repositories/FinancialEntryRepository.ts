import { FinancialEntry, CreateFinancialEntryRequest, FinancialEntryFilters } from '../entities/FinancialEntry';

export interface FinancialEntryRepository {
  findAll(filters?: FinancialEntryFilters): Promise<FinancialEntry[]>;
  create(request: CreateFinancialEntryRequest): Promise<FinancialEntry>;
}

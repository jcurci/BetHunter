import { FinancialEntryRepository } from '../../repositories/FinancialEntryRepository';
import { FinancialEntry, CreateFinancialEntryRequest, FinancialEntryFilters } from '../../entities/FinancialEntry';
import { FinancialEntryApi } from '../../../infrastructure/services/FinancialEntry.api';

export class FinancialEntryRepositoryImpl implements FinancialEntryRepository {
  constructor(private financialEntryApi: FinancialEntryApi) {}

  async findAll(filters?: FinancialEntryFilters): Promise<FinancialEntry[]> {
    return await this.financialEntryApi.findAll(filters);
  }

  async create(request: CreateFinancialEntryRequest): Promise<FinancialEntry> {
    return await this.financialEntryApi.create(request);
  }
}

import { FinancialEntryRepository } from '../repositories/FinancialEntryRepository';
import { FinancialEntry, FinancialEntryFilters } from '../entities/FinancialEntry';

export class GetFinancialEntriesUseCase {
  constructor(private financialEntryRepository: FinancialEntryRepository) {}

  async execute(filters?: FinancialEntryFilters): Promise<FinancialEntry[]> {
    return this.financialEntryRepository.findAll(filters);
  }
}

import { BudgetRepository } from '../../repositories/BudgetRepository';

export class DismissNoEntriesBannerUseCase {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(): Promise<void> {
    return this.budgetRepository.markBannerDismissed();
  }
}

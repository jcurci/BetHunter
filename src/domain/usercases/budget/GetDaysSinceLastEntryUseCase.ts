import { BudgetRepository } from '../../repositories/BudgetRepository';

export interface NoEntriesBannerStatus {
  days: number;
  shouldShow: boolean;
}

export class GetDaysSinceLastEntryUseCase {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(): Promise<NoEntriesBannerStatus> {
    const [days, dismissed] = await Promise.all([
      this.budgetRepository.getDaysSinceLastEntry(),
      this.budgetRepository.wasBannerDismissedRecently(),
    ]);
    return {
      days,
      shouldShow: days >= 7 && !dismissed,
    };
  }
}

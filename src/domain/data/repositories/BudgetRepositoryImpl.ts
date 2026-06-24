import AsyncStorage from '@react-native-async-storage/async-storage';

import { BudgetRepository } from '../../repositories/BudgetRepository';
import {
  Budget,
  BudgetExpenseSnapshot,
  BudgetPeriodSummary,
  periodKeyFromDate,
} from '../../entities/Budget';
import {
  BudgetApi,
  BudgetApiResponse,
  BudgetExpenseApiResponse,
} from '../../../infrastructure/services/BudgetApi';

const BANNER_DISMISSED_KEY = '@budget_banner_dismissed_at';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function toPeriodKey(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function mapApiBudgetToEntity(api: BudgetApiResponse): Budget {
  return {
    id: api.id,
    periodKey: toPeriodKey(api.month, api.year),
    value: api.limit,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
  };
}

function mapApiExpenseToSnapshot(
  api: BudgetExpenseApiResponse,
  periodKey: string,
): BudgetExpenseSnapshot {
  return {
    id: api.id,
    periodKey,
    categoryId: api.categoryId,
    categoryName: api.category ?? '',
    categoryIcon: undefined,
    value: api.amount,
    description: api.description ?? '',
    date: api.expenseDate,
  };
}

export class BudgetRepositoryImpl implements BudgetRepository {
  constructor(private readonly budgetApi: BudgetApi) {}

  async getCurrentBudget(periodKey?: string): Promise<Budget | null> {
    const api = await this.budgetApi.getCurrentBudget();
    if (!api) return null;

    // periodKey is only used for historical lookups; for current month,
    // we always return the active budget regardless of what was passed.
    const targetKey = periodKey ?? periodKeyFromDate(new Date());
    const apiKey = toPeriodKey(api.month, api.year);
    if (apiKey !== targetKey) return null;

    return mapApiBudgetToEntity(api);
  }

  async setCurrentBudget(value: number, periodKey?: string): Promise<Budget> {
    const existing = await this.budgetApi.getCurrentBudget();

    let api: BudgetApiResponse;
    if (existing) {
      api = await this.budgetApi.updateBudget(value);
    } else {
      const key = periodKey ?? periodKeyFromDate(new Date());
      const [yearStr, monthStr] = key.split('-');
      api = await this.budgetApi.createBudget(
        value,
        parseInt(monthStr, 10),
        parseInt(yearStr, 10),
      );
    }

    return mapApiBudgetToEntity(api);
  }

  async getHistory(): Promise<BudgetPeriodSummary[]> {
    const items = await this.budgetApi.getHistory();
    return items.map((item) => ({
      periodKey: toPeriodKey(item.month, item.year),
      budgetValue: item.limit,
      totalSpent: item.spent,
      balance: item.finalBalance ?? (item.limit - item.spent),
    }));
  }

  async getExpensesForPeriod(periodKey: string): Promise<BudgetExpenseSnapshot[]> {
    const currentKey = periodKeyFromDate(new Date());

    try {
      if (periodKey === currentKey) {
        const expenses = await this.budgetApi.getExpenses();
        return expenses.map((e) => mapApiExpenseToSnapshot(e, periodKey));
      }

      // Historical: find the budget ID from the history list
      const history = await this.budgetApi.getHistory();
      const match = history.find((h) => toPeriodKey(h.month, h.year) === periodKey);
      if (!match) return [];

      const expenses = await this.budgetApi.getPreviousMonthExpenses(match.id);
      return expenses.map((e) => mapApiExpenseToSnapshot(e, periodKey));
    } catch (error: any) {
      // 404 = no active budget or budget not found; return empty list
      if (error?.response?.status === 404) return [];
      throw error;
    }
  }

  async getPeriodSummary(periodKey?: string): Promise<BudgetPeriodSummary | null> {
    const key = periodKey ?? periodKeyFromDate(new Date());
    const currentKey = periodKeyFromDate(new Date());

    if (key === currentKey) {
      const api = await this.budgetApi.getCurrentBudget();
      if (!api) return null;
      return {
        periodKey: key,
        budgetValue: api.limit,
        totalSpent: api.spent,
        balance: api.remaining,
      };
    }

    // Historical
    const history = await this.budgetApi.getHistory();
    const match = history.find((h) => toPeriodKey(h.month, h.year) === key);
    if (!match) return null;
    return {
      periodKey: key,
      budgetValue: match.limit,
      totalSpent: match.spent,
      balance: match.finalBalance ?? (match.limit - match.spent),
    };
  }

  async addExpense(input: {
    categoryId: string;
    amount: number;
    description?: string;
    expenseDate: Date;
  }): Promise<BudgetExpenseSnapshot> {
    const api = await this.budgetApi.addExpense({
      categoryId: input.categoryId,
      amount: input.amount,
      description: input.description,
      expenseDate: input.expenseDate.toISOString().split('T')[0],
    });

    const periodKey = periodKeyFromDate(input.expenseDate);
    return mapApiExpenseToSnapshot(api, periodKey);
  }

  async getDaysSinceLastEntry(): Promise<number> {
    const result = await this.budgetApi.checkInactivity();
    return result.daysSinceLastExpense;
  }

  async markBannerDismissed(): Promise<void> {
    await AsyncStorage.setItem(BANNER_DISMISSED_KEY, String(Date.now()));
  }

  async wasBannerDismissedRecently(): Promise<boolean> {
    const raw = await AsyncStorage.getItem(BANNER_DISMISSED_KEY);
    if (!raw) return false;
    return Date.now() - parseInt(raw, 10) < SEVEN_DAYS_MS;
  }
}

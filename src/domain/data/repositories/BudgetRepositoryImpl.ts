import { BudgetRepository } from '../../repositories/BudgetRepository';
import {
  Budget,
  BudgetExpenseSnapshot,
  BudgetPeriodSummary,
  periodKeyFromDate,
} from '../../entities/Budget';

/**
 * Implementação MOCK em memória do Modo Orçamento.
 *
 * Persistência atual: singleton de módulo. Reseta a cada cold start.
 * Cada método marca com TODO(API) onde a integração real deve substituir o mock.
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface InternalState {
  budgets: Map<string, Budget>;
  expenses: Map<string, BudgetExpenseSnapshot[]>;
  bannerDismissedAt: number | null;
}

function buildInitialState(): InternalState {
  // TODO(API): substituir esses dados de demonstração por GET /budgets/history.
  const demoHistory: Budget[] = [];
  const demoExpenses = new Map<string, BudgetExpenseSnapshot[]>();
  return {
    budgets: new Map(demoHistory.map((b) => [b.periodKey, b])),
    expenses: demoExpenses,
    bannerDismissedAt: null,
  };
}

const state: InternalState = buildInitialState();

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function sumExpenses(list: BudgetExpenseSnapshot[]): number {
  return list.reduce((acc, item) => acc + (item.value || 0), 0);
}

function comparePeriodDesc(a: string, b: string): number {
  return a < b ? 1 : a > b ? -1 : 0;
}

export class BudgetRepositoryImpl implements BudgetRepository {
  async getCurrentBudget(periodKey?: string): Promise<Budget | null> {
    // TODO(API): substituir por GET /budgets?period={periodKey}.
    const key = periodKey ?? periodKeyFromDate(new Date());
    return state.budgets.get(key) ?? null;
  }

  async setCurrentBudget(value: number, periodKey?: string): Promise<Budget> {
    // TODO(API): substituir por POST/PUT /budgets com { periodKey, value }.
    const key = periodKey ?? periodKeyFromDate(new Date());
    const existing = state.budgets.get(key);
    const nowIso = new Date().toISOString();

    const next: Budget = existing
      ? { ...existing, value, updatedAt: nowIso }
      : {
          id: genId('budget'),
          periodKey: key,
          value,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

    state.budgets.set(key, next);
    return next;
  }

  async getHistory(): Promise<BudgetPeriodSummary[]> {
    // TODO(API): substituir por GET /budgets/history (resumo por período).
    const currentKey = periodKeyFromDate(new Date());
    const keys = Array.from(state.budgets.keys())
      .filter((k) => k !== currentKey)
      .sort(comparePeriodDesc);

    return keys.map((key) => {
      const budget = state.budgets.get(key)!;
      const totalSpent = sumExpenses(state.expenses.get(key) ?? []);
      return {
        periodKey: key,
        budgetValue: budget.value,
        totalSpent,
        balance: budget.value - totalSpent,
      };
    });
  }

  async getExpensesForPeriod(periodKey: string): Promise<BudgetExpenseSnapshot[]> {
    // TODO(API): substituir por GET /financial-entries?periodKey={periodKey}&type=EXPENSE
    // (a UI pode passar a depender direto do FinancialEntryRepository ao invés do snapshot local).
    const list = state.expenses.get(periodKey) ?? [];
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  async getPeriodSummary(periodKey?: string): Promise<BudgetPeriodSummary | null> {
    // TODO(API): substituir por GET /budgets/summary?period={periodKey}.
    const key = periodKey ?? periodKeyFromDate(new Date());
    const budget = state.budgets.get(key);
    if (!budget) return null;
    const totalSpent = sumExpenses(state.expenses.get(key) ?? []);
    return {
      periodKey: key,
      budgetValue: budget.value,
      totalSpent,
      balance: budget.value - totalSpent,
    };
  }

  async appendExpenseSnapshot(
    snapshot: Omit<BudgetExpenseSnapshot, 'id'>,
  ): Promise<BudgetExpenseSnapshot> {
    // TODO(API): remover quando a UI passar a ler gastos diretamente de
    // /financial-entries filtrando pelo período do orçamento.
    const item: BudgetExpenseSnapshot = { id: genId('exp'), ...snapshot };
    const current = state.expenses.get(snapshot.periodKey) ?? [];
    state.expenses.set(snapshot.periodKey, [item, ...current]);
    return item;
  }

  async getDaysSinceLastEntry(): Promise<number> {
    // TODO(API): substituir por query ao backend que retorna a diferença em dias
    // entre hoje e o createdAt do último FinancialEntry do usuário.
    // Mock: retorna 8 para permitir validar o banner visualmente.
    return 8;
  }

  async markBannerDismissed(): Promise<void> {
    // TODO(API): substituir por POST /user/preferences/budget-banner-dismissed.
    state.bannerDismissedAt = Date.now();
  }

  async wasBannerDismissedRecently(): Promise<boolean> {
    // TODO(API): a regra (janela de 7 dias) também pode vir do backend.
    if (state.bannerDismissedAt == null) return false;
    return Date.now() - state.bannerDismissedAt < SEVEN_DAYS_MS;
  }
}

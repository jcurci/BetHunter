import { BudgetRepository } from '../../repositories/BudgetRepository';
import { CreateFinancialEntryUseCase } from '../CreateFinancialEntryUseCase';
import { FinancialEntry } from '../../entities/FinancialEntry';
import { BudgetExpenseSnapshot, periodKeyFromDate } from '../../entities/Budget';

export interface RegisterBudgetExpenseInput {
  valor: string;
  descricao: string;
  data: Date;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
}

export interface RegisterBudgetExpenseResult {
  entry: FinancialEntry;
  snapshot: BudgetExpenseSnapshot;
}

/**
 * Orquestrador do registro de gasto no Modo Orçamento.
 *
 * Adendo 2: REUTILIZA o mesmo CreateFinancialEntryUseCase do botão "Nova Saída"
 *            do Acessor — não cria pipeline paralelo nem novo endpoint.
 * Adendo 6: mantém uma cópia local (snapshot) para alimentar a UI enquanto o
 *            backend não expõe a listagem por período do orçamento.
 */
export class RegisterBudgetExpenseUseCase {
  constructor(
    private createFinancialEntryUseCase: CreateFinancialEntryUseCase,
    private budgetRepository: BudgetRepository,
  ) {}

  async execute(input: RegisterBudgetExpenseInput): Promise<RegisterBudgetExpenseResult> {
    const entry = await this.createFinancialEntryUseCase.execute(
      input.valor,
      input.descricao,
      input.data,
      input.categoryId,
      'saida',
    );

    // TODO(API): quando a UI consumir gastos direto de
    // /financial-entries filtrando pelo período do orçamento,
    // remover o append abaixo (ele só existe para alimentar o mock).
    const snapshot = await this.budgetRepository.appendExpenseSnapshot({
      periodKey: periodKeyFromDate(input.data),
      categoryId: input.categoryId,
      categoryName: input.categoryName,
      categoryIcon: input.categoryIcon,
      value: parseFloat(entry.valor) || 0,
      description: entry.descricao,
      date: entry.data.toISOString(),
    });

    return { entry, snapshot };
  }
}

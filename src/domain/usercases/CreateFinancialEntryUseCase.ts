import { FinancialEntryRepository } from '../repositories/FinancialEntryRepository';
import { FinancialEntry, CreateFinancialEntryRequest } from '../entities/FinancialEntry';
import { ValidationError } from '../errors/CustomErrors';

export class CreateFinancialEntryUseCase {
  constructor(private financialEntryRepository: FinancialEntryRepository) {}

  async execute(
    valor: string,
    descricao: string,
    data: Date,
    categoryId: string
  ): Promise<FinancialEntry> {
    // Validações
    if (!valor || valor.trim() === '') {
      throw new ValidationError('Valor é obrigatório');
    }

    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      throw new ValidationError('Valor deve ser um número positivo');
    }

    if (!descricao || descricao.trim() === '') {
      throw new ValidationError('Descrição é obrigatória');
    }

    if (!categoryId || categoryId.trim() === '') {
      throw new ValidationError('Categoria é obrigatória');
    }

    if (!data || !(data instanceof Date) || isNaN(data.getTime())) {
      throw new ValidationError('Data inválida');
    }

    const request: CreateFinancialEntryRequest = {
      category_id: categoryId,
      balance: valorNumerico,
      description: descricao.trim(),
      created_at: data,
    };

    return this.financialEntryRepository.create(request);
  }
}

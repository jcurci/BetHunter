import type { BettingHouseReportRepository } from '../repositories/BettingHouseReportRepository';
import { ValidationError } from '../errors/CustomErrors';

function normalizeUrl(input: string): string {
  const t = input.trim();
  if (!t) {
    throw new ValidationError('Informe a URL do site ou app.');
  }
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    throw new ValidationError('URL inválida. Verifique o endereço e tente novamente.');
  }
  if (!u.hostname || !u.hostname.includes('.')) {
    throw new ValidationError('URL inválida. Ex.: exemplo-apostas.com');
  }
  return u.href;
}

export class SubmitBettingHouseReportUseCase {
  constructor(private readonly repo: BettingHouseReportRepository) {}

  async execute(rawUrl: string): Promise<void> {
    const url = normalizeUrl(rawUrl);
    await this.repo.submitReport({ url });
  }
}

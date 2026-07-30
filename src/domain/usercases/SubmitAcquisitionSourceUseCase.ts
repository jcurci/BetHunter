import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { AcquisitionSourceRepository } from '../repositories/AcquisitionSourceRepository';
import { ValidationError } from '../errors/CustomErrors';

/**
 * Ids da UI → membros do enum do backend.
 *
 * Mapa explícito em vez de `toUpperCase()`: hoje todos coincidem, mas um id
 * futuro como 'google-ads' produziria um enum inválido e um 400 silencioso
 * (o POST é fire-and-forget, ninguém veria o erro).
 */
const SOURCE_MAP: Record<string, string> = {
  instagram: 'INSTAGRAM',
  tiktok: 'TIKTOK',
  youtube: 'YOUTUBE',
  google: 'GOOGLE',
  indicacao: 'INDICACAO',
  grupo: 'GRUPO',
  anuncio: 'ANUNCIO',
  podcast: 'PODCAST',
  loja: 'LOJA',
  outro: 'OUTRO',
  nao_informado: 'NAO_INFORMADO',
};

export interface SubmitAcquisitionSourceInput {
  source: string;
  sourceOther?: string | null;
}

export class SubmitAcquisitionSourceUseCase {
  constructor(private readonly repository: AcquisitionSourceRepository) {}

  async execute(input: SubmitAcquisitionSourceInput): Promise<void> {
    const source = SOURCE_MAP[input.source];
    if (!source) {
      throw new ValidationError('Origem inválida.');
    }

    await this.repository.submit({
      source,
      sourceOther:
        source === 'OUTRO'
          ? input.sourceOther?.trim().slice(0, 60) || null
          : null,
      platform: Platform.OS,
      appVersion: Constants.expoConfig?.version ?? undefined,
    });
  }
}

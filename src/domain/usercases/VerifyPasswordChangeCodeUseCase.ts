import { AuthRepository } from '../repositories/AuthRepository';
import { ValidationError } from '../errors/CustomErrors';

export class VerifyPasswordChangeCodeUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(email: string, code: string): Promise<void> {
    const trimmedEmail = email?.trim();
    const trimmedCode = code?.trim();
    if (!trimmedEmail) {
      throw new ValidationError('E-mail é obrigatório.');
    }
    if (!trimmedCode) {
      throw new ValidationError('Código é obrigatório.');
    }
    await this.authRepository.verifyPasswordChangeCode(trimmedEmail, trimmedCode);
  }
}

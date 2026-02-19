import { AuthRepository } from '../repositories/AuthRepository';
import { ValidationError } from '../errors/CustomErrors';

export class RequestPasswordChangeUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(email: string): Promise<void> {
    const trimmed = email?.trim();
    if (!trimmed) {
      throw new ValidationError('Informe o e-mail.');
    }
    await this.authRepository.requestPasswordChange(trimmed);
  }
}

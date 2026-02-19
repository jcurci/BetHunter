import { AuthRepository } from '../repositories/AuthRepository';
import { ValidationError } from '../errors/CustomErrors';

export class ConfirmPasswordChangeUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(email: string, code: string, newPassword: string): Promise<void> {
    const trimmedEmail = email?.trim();
    const trimmedCode = code?.trim();
    if (!trimmedEmail) {
      throw new ValidationError('E-mail é obrigatório.');
    }
    if (!trimmedCode) {
      throw new ValidationError('Código é obrigatório.');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new ValidationError('A senha deve conter no mínimo 8 caracteres.');
    }
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(newPassword)) {
      throw new ValidationError('A senha deve conter no mínimo um caractere especial.');
    }
    await this.authRepository.confirmPasswordChange(trimmedEmail, trimmedCode, newPassword);
  }
}

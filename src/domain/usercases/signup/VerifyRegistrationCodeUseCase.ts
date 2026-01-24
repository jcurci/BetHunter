import { RegisterRepository } from "../../repositories/RegisterRepository";
import { ValidationError } from "../../errors/CustomErrors";

export class VerifyRegistrationCodeUseCase {
  constructor(private registerRepository: RegisterRepository) {}

  async execute(email: string, code: string): Promise<void> {
    if (!email || !email.trim()) {
      throw new ValidationError('Email é obrigatório');
    }

    if (!code || !code.trim()) {
      throw new ValidationError('Código é obrigatório');
    }

    if (code.length !== 6) {
      throw new ValidationError('Código deve ter 6 dígitos');
    }

    return this.registerRepository.verifyCode(email, code);
  }
}

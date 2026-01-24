import { RegisterRepository } from "../../repositories/RegisterRepository";
import { RegisterResult } from "../../entities/signup/RegisterResult";
import { ValidationError } from "../../errors/CustomErrors";

export class CreatePasswordUseCase {
  constructor(private registerRepository: RegisterRepository) {}

  async execute(email: string, password: string): Promise<RegisterResult> {
    if (!email || !email.trim()) {
      throw new ValidationError('Email é obrigatório');
    }

    if (!password || !password.trim()) {
      throw new ValidationError('Senha é obrigatória');
    }

    if (password.length < 8) {
      throw new ValidationError('A senha deve ter no mínimo 8 caracteres');
    }

    const specialChars = /[!@#$%]/;
    if (!specialChars.test(password)) {
      throw new ValidationError('A senha deve conter pelo menos um caractere especial (!, @, #, $, %)');
    }

    return this.registerRepository.createPassword(email, password);
  }
}

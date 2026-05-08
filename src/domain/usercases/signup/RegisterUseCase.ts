import { RegisterRepository } from "../../repositories/RegisterRepository";
import { RegisterRequest } from "../../entities/signup/RegisterRequest";
import { RegisterResult } from "../../entities/signup/RegisterResult";
import { ValidationError } from "../../errors/CustomErrors";

export class RegisterUseCase {
  constructor(private registerRepository: RegisterRepository) {}

  async execute(request: RegisterRequest): Promise<RegisterResult> {
    if (!request.email || !request.email.trim()) {
      throw new ValidationError('Email é obrigatório');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      throw new ValidationError('Email inválido');
    }

    if (!request.name || !request.name.trim()) {
      throw new ValidationError('Nome é obrigatório');
    }

    if (!request.username || !request.username.trim()) {
      throw new ValidationError('Nome de usuário é obrigatório');
    }

    if (!request.cellphone || !request.cellphone.trim()) {
      throw new ValidationError('Telefone é obrigatório');
    }

    if (!request.password || !request.password.trim()) {
      throw new ValidationError('Senha é obrigatória');
    }

    if (request.password.length < 8) {
      throw new ValidationError('A senha deve ter no mínimo 8 caracteres');
    }

    const specialChars = /[!@#$%]/;
    if (!specialChars.test(request.password)) {
      throw new ValidationError('A senha deve conter pelo menos um caractere especial (!, @, #, $, %)');
    }

    return this.registerRepository.register(request);
  }
}

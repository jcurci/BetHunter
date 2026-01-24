import { RegisterRepository } from "../../repositories/RegisterRepository";
import { RegisterRequest } from "../../entities/signup/RegisterRequest";
import { ValidationError } from "../../errors/CustomErrors";

export class StartRegistrationUseCase {
  constructor(private registerRepository: RegisterRepository) {}

  async execute(request: RegisterRequest): Promise<void> {
    if (!request.email || !request.email.trim()) {
      throw new ValidationError('Email é obrigatório');
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

    // Valida formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      throw new ValidationError('Email inválido');
    }

    return this.registerRepository.startRegistration(request);
  }
}

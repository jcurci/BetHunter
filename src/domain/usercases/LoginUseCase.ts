import { AuthRepository } from "../repositories/AuthRepository"
import { ValidationError } from "../errors/CustomErrors"

export class LoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(email: string, password: string) {
    if (!email || !password) {
      throw new ValidationError('Credenciais inválidas')
    }

    return this.authRepository.login(email, password)
  }
}
import { AuthRepository } from "../repositories/AuthRepository"
import { ValidationError } from "../errors/CustomErrors"

export class LoginWithGoogleUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(idToken: string) {
    if (!idToken) {
      throw new ValidationError('Token Google não disponível')
    }

    return this.authRepository.loginWithGoogle(idToken)
  }
}

import { AuthRepository } from '../../repositories/AuthRepository';
import { AuthApi } from '../../../infrastructure/services/Auth.api';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(private authApi: AuthApi) {}

  async login(email: string, password: string) {
    return await this.authApi.login(email, password);
  }

  async requestPasswordChange(email: string): Promise<void> {
    return await this.authApi.requestPasswordChange(email);
  }

  async verifyPasswordChangeCode(email: string, code: string): Promise<void> {
    return await this.authApi.verifyPasswordChangeCode(email, code);
  }

  async confirmPasswordChange(email: string, code: string, newPassword: string): Promise<void> {
    return await this.authApi.confirmPasswordChange(email, code, newPassword);
  }
}

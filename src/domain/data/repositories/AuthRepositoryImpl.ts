import { AuthRepository } from '../../repositories/AuthRepository';
import { AuthApi } from '../../../infrastructure/services/Auth.api';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(private authApi: AuthApi) {}

  async login(email: string, password: string) {
    return await this.authApi.login(email, password);
  }
}

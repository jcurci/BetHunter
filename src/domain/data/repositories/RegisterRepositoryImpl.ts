import { RegisterRepository } from '../../repositories/RegisterRepository';
import { RegisterApi } from '../../../infrastructure/services/Register.api';
import { RegisterRequest } from '../../entities/signup/RegisterRequest';
import { RegisterResult } from '../../entities/signup/RegisterResult';

export class RegisterRepositoryImpl implements RegisterRepository {
  constructor(private registerApi: RegisterApi) {}

  async startRegistration(request: RegisterRequest): Promise<void> {
    return await this.registerApi.startRegistration(request);
  }

  async verifyCode(email: string, code: string): Promise<void> {
    return await this.registerApi.verifyCode(email, code);
  }

  async createPassword(email: string, password: string): Promise<RegisterResult> {
    return await this.registerApi.createPassword(email, password);
  }
}

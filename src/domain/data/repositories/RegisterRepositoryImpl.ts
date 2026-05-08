import { RegisterRepository } from '../../repositories/RegisterRepository';
import { RegisterApi } from '../../../infrastructure/services/Register.api';
import { RegisterRequest } from '../../entities/signup/RegisterRequest';
import { RegisterResult } from '../../entities/signup/RegisterResult';

export class RegisterRepositoryImpl implements RegisterRepository {
  constructor(private registerApi: RegisterApi) {}

  async register(request: RegisterRequest): Promise<RegisterResult> {
    return await this.registerApi.register(request);
  }
}

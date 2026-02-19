import { UserRepository } from '../../repositories/UserRepository';
import { UserApi } from '../../../infrastructure/services/User.api';

export class UserRepositoryImpl implements UserRepository {
  constructor(private userApi: UserApi) {}

  async getById(userId: string) {
    return await this.userApi.getById(userId);
  }

  async loadDashboard() {
    return await this.userApi.getDashboard();
  }
}

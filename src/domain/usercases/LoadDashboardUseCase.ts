import { UserRepository } from '../repositories/UserRepository';
import { Dashboard } from '../entities/Dashboard';

export class LoadDashboardUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(): Promise<Dashboard> {
    return this.userRepository.loadDashboard();
  }
}

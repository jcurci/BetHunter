import { UserProfile } from '../entities/UserProfile';
import { Dashboard } from '../entities/Dashboard';

export interface UserRepository {
  getById(userId: string): Promise<UserProfile>;
  loadDashboard(): Promise<Dashboard>;
}

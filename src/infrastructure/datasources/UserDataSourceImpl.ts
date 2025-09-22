import { User, UserCredentials, UserRegistration } from '../../domain/entities/User';
import { UserDataSource } from '../../data/datasources/UserDataSource';
import { StorageService } from '../storage/StorageService';

export class UserDataSourceImpl implements UserDataSource {
  constructor(private storageService: StorageService) {}

  async login(credentials: UserCredentials): Promise<User> {
    // Busca usuário existente no storage
    const existingUser = await this.getCurrentUser();
    
    if (existingUser && existingUser.email === credentials.email) {
      // Usuário já existe, apenas atualiza a sessão
      await this.storageService.setItem('currentUser', JSON.stringify(existingUser));
      return existingUser;
    }

    // Se não existe, cria um novo usuário (simulação de login bem-sucedido)
    const newUser: User = {
      id: Date.now().toString(),
      name: 'Usuário',
      email: credentials.email,
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.storageService.setItem('currentUser', JSON.stringify(newUser));
    return newUser;
  }

  async register(userData: UserRegistration): Promise<User> {
    // Simulação de registro - em produção seria uma chamada para API
    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.storageService.setItem('currentUser', JSON.stringify(newUser));
    return newUser;
  }

  async getCurrentUser(): Promise<User | null> {
    const userData = await this.storageService.getItem('currentUser');
    if (!userData) return null;
    return JSON.parse(userData);
  }

  async updateUserPoints(userId: string, points: number): Promise<User> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error('User not found');

    const updatedUser: User = {
      ...currentUser,
      points,
      updatedAt: new Date(),
    };

    await this.storageService.setItem('currentUser', JSON.stringify(updatedUser));
    return updatedUser;
  }

  async logout(): Promise<void> {
    await this.storageService.removeItem('currentUser');
  }
} 
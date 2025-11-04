import { User, UserCredentials, UserRegistration } from '../entities/User';
import { UserRepository } from '../repositories/UserRepository';
import { ValidationError } from '../errors/CustomErrors';

export class UserUseCase {
  constructor(private userRepository: UserRepository) {}

  /**
   * Realiza login do usuário
   * @throws ValidationError se email ou password estiverem vazios
   */
  async login(credentials: UserCredentials): Promise<User> {
    // Validação de entrada
    if (!credentials.email || credentials.email.trim() === '') {
      throw new ValidationError('Email é obrigatório');
    }

    if (!credentials.password || credentials.password.trim() === '') {
      throw new ValidationError('Senha é obrigatória');
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new ValidationError('Email inválido');
    }

    // Validação de tamanho mínimo da senha
    if (credentials.password.length < 6) {
      throw new ValidationError('Senha deve ter no mínimo 6 caracteres');
    }

    return await this.userRepository.login(credentials);
  }

  /**
   * Registra novo usuário
   * @throws ValidationError se campos obrigatórios estiverem vazios
   */
  async register(userData: UserRegistration): Promise<User> {
    // Validação de campos obrigatórios
    if (!userData.name || userData.name.trim() === '') {
      throw new ValidationError('Nome é obrigatório');
    }

    if (!userData.email || userData.email.trim() === '') {
      throw new ValidationError('Email é obrigatório');
    }

    if (!userData.password || userData.password.trim() === '') {
      throw new ValidationError('Senha é obrigatória');
    }

    if (!userData.cellphone || userData.cellphone.trim() === '') {
      throw new ValidationError('Telefone é obrigatório');
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new ValidationError('Email inválido');
    }

    // Validação de senha (mínimo 8 caracteres, pelo menos 1 caractere especial)
    if (userData.password.length < 8) {
      throw new ValidationError('Senha deve ter no mínimo 8 caracteres');
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(userData.password)) {
      throw new ValidationError('Senha deve conter pelo menos 1 caractere especial');
    }

    // Validação de nome (mínimo 3 caracteres)
    if (userData.name.length < 3) {
      throw new ValidationError('Nome deve ter no mínimo 3 caracteres');
    }

    return await this.userRepository.register(userData);
  }

  async getCurrentUser(): Promise<User | null> {
    return await this.userRepository.getCurrentUser();
  }

  /**
   * Atualiza pontos do usuário
   * @throws ValidationError se pontos forem negativos
   */
  async updateUserPoints(userId: string, points: number): Promise<User> {
    if (!userId || userId.trim() === '') {
      throw new ValidationError('ID do usuário é obrigatório');
    }

    if (points < 0) {
      throw new ValidationError('Pontos não podem ser negativos');
    }

    return await this.userRepository.updateUserPoints(userId, points);
  }

  async logout(): Promise<void> {
    return await this.userRepository.logout();
  }
} 
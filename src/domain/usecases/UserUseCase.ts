import { User, UserCredentials, UserRegistration, LoginResult, VerificationCodeRequest } from '../entities/User';
import { UserRepository } from '../repositories/UserRepository';
import { ValidationError } from '../errors/CustomErrors';

export class UserUseCase {
  constructor(private userRepository: UserRepository) {}

  /**
   * Realiza login do usuário
   * @returns LoginResult com user e token
   * @throws ValidationError se email ou password estiverem vazios/inválidos
   */
  async login(credentials: UserCredentials): Promise<LoginResult> {
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
   * Envia código de verificação por email (sem senha)
   * @throws ValidationError se campos obrigatórios estiverem vazios
   */
  async sendVerificationCode(data: VerificationCodeRequest): Promise<void> {
    // Validação de campos obrigatórios
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('Nome é obrigatório');
    }

    if (!data.email || data.email.trim() === '') {
      throw new ValidationError('Email é obrigatório');
    }

    if (!data.cellphone || data.cellphone.trim() === '') {
      throw new ValidationError('Telefone é obrigatório');
    }

    if (!data.username || data.username.trim() === '') {
      throw new ValidationError('Nome de usuário é obrigatório');
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new ValidationError('Email inválido');
    }

    // Validação de nome (mínimo 3 caracteres)
    if (data.name.length < 3) {
      throw new ValidationError('Nome deve ter no mínimo 3 caracteres');
    }

    return await this.userRepository.sendVerificationCode(data);
  }

  /**
   * Verifica email com código de verificação
   * @throws ValidationError se email ou código estiverem vazios
   */
  async verifyEmail(email: string, code: string): Promise<void> {
    if (!email || email.trim() === '') {
      throw new ValidationError('Email é obrigatório');
    }

    if (!code || code.trim() === '') {
      throw new ValidationError('Código de verificação é obrigatório');
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new ValidationError('Email inválido');
    }

    return await this.userRepository.verifyEmail(email.trim().toLowerCase(), code.trim());
  }

  /**
   * Cria senha e completa registro do usuário
   * @throws ValidationError se email ou senha estiverem vazios
   */
  async createPassword(email: string, password: string): Promise<User> {
    if (!email || email.trim() === '') {
      throw new ValidationError('Email é obrigatório');
    }

    if (!password || password.trim() === '') {
      throw new ValidationError('Senha é obrigatória');
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new ValidationError('Email inválido');
    }

    // Validação de senha (mínimo 8 caracteres, pelo menos 1 caractere especial)
    if (password.length < 8) {
      throw new ValidationError('Senha deve ter no mínimo 8 caracteres');
    }

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharRegex.test(password)) {
      throw new ValidationError('Senha deve conter pelo menos 1 caractere especial');
    }

    return await this.userRepository.createPassword(email.trim().toLowerCase(), password);
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
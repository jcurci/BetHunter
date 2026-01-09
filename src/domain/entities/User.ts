/**
 * Usuário completo do domínio
 */
export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  betcoins: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Usuário para autenticação (estado reativo)
 * Versão simplificada sem timestamps
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  points: number;
  betcoins: number;
}

/**
 * Credenciais de login
 */
export interface UserCredentials {
  email: string;
  password: string;
}

/**
 * Dados para registro de usuário
 */
export interface UserRegistration extends UserCredentials {
  name: string;
  cellphone: string;
}

/**
 * Dados para envio de código de verificação (sem senha)
 */
export interface VerificationCodeRequest {
  name: string;
  username: string;
  email: string;
  cellphone: string;
}

/**
 * Resultado do login - retorna user E token
 */
export interface LoginResult {
  user: User;
  token: string;
}

/**
 * Converte User para AuthUser (remove timestamps)
 */
export const toAuthUser = (user: User): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  points: user.points,
  betcoins: user.betcoins,
});

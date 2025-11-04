/**
 * Erro de validação - quando dados de entrada são inválidos
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Erro de autenticação - quando credenciais são inválidas ou token expirou
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Erro de não encontrado - quando recurso não existe
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Erro de saldo insuficiente - quando usuário não tem pontos suficientes
 */
export class InsufficientBalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}

/**
 * Erro de regra de negócio - quando uma regra do domínio é violada
 */
export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}






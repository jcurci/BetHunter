export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Credenciais inválidas') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ServerError extends Error {
  constructor(message: string = 'Erro no servidor') {
    super(message);
    this.name = 'ServerError';
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserRegistration extends UserCredentials {
  name: string;
  cellphone: string;
} 
export interface RegisterRequest {
  email: string;
  name: string;
  username: string;
  cellphone?: string;
  password: string;
  gambler?: boolean;
}

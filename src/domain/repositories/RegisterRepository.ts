import { RegisterRequest } from "../entities/signup/RegisterRequest";
import { RegisterResult } from "../entities/signup/RegisterResult";

export interface RegisterRepository {
  startRegistration(request: RegisterRequest): Promise<void>;
  verifyCode(email: string, code: string): Promise<void>;
  createPassword(email: string, password: string): Promise<RegisterResult>;
}

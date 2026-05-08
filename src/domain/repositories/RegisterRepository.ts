import { RegisterRequest } from "../entities/signup/RegisterRequest";
import { RegisterResult } from "../entities/signup/RegisterResult";

export interface RegisterRepository {
  register(request: RegisterRequest): Promise<RegisterResult>;
}

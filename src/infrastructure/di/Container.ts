// infrastructure/di/Container.ts
import { LoginUseCase } from "../../domain/usercases/LoginUseCase";
import { AuthRepositoryImpl } from "../../domain/data/repositories/AuthRepositoryImpl";
import { AuthApi } from "../services/Auth.api";

export class Container {
  private static instance: Container;

  private loginUseCase: LoginUseCase | null = null;

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  getLoginUseCase(): LoginUseCase {
    if (!this.loginUseCase) {
      const authApi = new AuthApi();
      const authRepository = new AuthRepositoryImpl(authApi);
      this.loginUseCase = new LoginUseCase(authRepository);
    }

    return this.loginUseCase;
  }
}

// infrastructure/di/Container.ts
import { LoginUseCase } from "../../domain/usercases/LoginUseCase";
import { AuthRepositoryImpl } from "../../domain/data/repositories/AuthRepositoryImpl";
import { AuthApi } from "../services/Auth.api";
import { StartRegistrationUseCase } from "../../domain/usercases/signup/StartRegistrationUseCase";
import { VerifyRegistrationCodeUseCase } from "../../domain/usercases/signup/VerifyRegistrationCodeUseCase";
import { CreatePasswordUseCase } from "../../domain/usercases/signup/CreatePasswordUseCase";
import { RegisterRepositoryImpl } from "../../domain/data/repositories/RegisterRepositoryImpl";
import { RegisterApi } from "../services/Register.api";

// Financial imports
import { GetFinancialCategoriesUseCase } from "../../domain/usercases/GetFinancialCategoriesUseCase";
import { GetFinancialEntriesUseCase } from "../../domain/usercases/GetFinancialEntriesUseCase";
import { CreateFinancialEntryUseCase } from "../../domain/usercases/CreateFinancialEntryUseCase";
import { FinancialCategoryRepositoryImpl } from "../../domain/data/repositories/FinancialCategoryRepositoryImpl";
import { FinancialEntryRepositoryImpl } from "../../domain/data/repositories/FinancialEntryRepositoryImpl";
import { FinancialCategoryApi } from "../services/FinancialCategory.api";
import { FinancialEntryApi } from "../services/FinancialEntry.api";

export class Container {
  private static instance: Container;

  private loginUseCase: LoginUseCase | null = null;
  private startRegistrationUseCase: StartRegistrationUseCase | null = null;
  private verifyRegistrationCodeUseCase: VerifyRegistrationCodeUseCase | null = null;
  private createPasswordUseCase: CreatePasswordUseCase | null = null;

  // Financial use cases
  private getFinancialCategoriesUseCase: GetFinancialCategoriesUseCase | null = null;
  private getFinancialEntriesUseCase: GetFinancialEntriesUseCase | null = null;
  private createFinancialEntryUseCase: CreateFinancialEntryUseCase | null = null;

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

  getStartRegistrationUseCase(): StartRegistrationUseCase {
    if (!this.startRegistrationUseCase) {
      const registerApi = new RegisterApi();
      const registerRepository = new RegisterRepositoryImpl(registerApi);
      this.startRegistrationUseCase = new StartRegistrationUseCase(registerRepository);
    }

    return this.startRegistrationUseCase;
  }

  getVerifyRegistrationCodeUseCase(): VerifyRegistrationCodeUseCase {
    if (!this.verifyRegistrationCodeUseCase) {
      const registerApi = new RegisterApi();
      const registerRepository = new RegisterRepositoryImpl(registerApi);
      this.verifyRegistrationCodeUseCase = new VerifyRegistrationCodeUseCase(registerRepository);
    }

    return this.verifyRegistrationCodeUseCase;
  }

  getCreatePasswordUseCase(): CreatePasswordUseCase {
    if (!this.createPasswordUseCase) {
      const registerApi = new RegisterApi();
      const registerRepository = new RegisterRepositoryImpl(registerApi);
      this.createPasswordUseCase = new CreatePasswordUseCase(registerRepository);
    }

    return this.createPasswordUseCase;
  }

  // Financial use cases
  getGetFinancialCategoriesUseCase(): GetFinancialCategoriesUseCase {
    if (!this.getFinancialCategoriesUseCase) {
      const financialCategoryApi = new FinancialCategoryApi();
      const financialCategoryRepository = new FinancialCategoryRepositoryImpl(financialCategoryApi);
      this.getFinancialCategoriesUseCase = new GetFinancialCategoriesUseCase(financialCategoryRepository);
    }

    return this.getFinancialCategoriesUseCase;
  }

  getGetFinancialEntriesUseCase(): GetFinancialEntriesUseCase {
    if (!this.getFinancialEntriesUseCase) {
      const financialEntryApi = new FinancialEntryApi();
      const financialEntryRepository = new FinancialEntryRepositoryImpl(financialEntryApi);
      this.getFinancialEntriesUseCase = new GetFinancialEntriesUseCase(financialEntryRepository);
    }

    return this.getFinancialEntriesUseCase;
  }

  getCreateFinancialEntryUseCase(): CreateFinancialEntryUseCase {
    if (!this.createFinancialEntryUseCase) {
      const financialEntryApi = new FinancialEntryApi();
      const financialEntryRepository = new FinancialEntryRepositoryImpl(financialEntryApi);
      this.createFinancialEntryUseCase = new CreateFinancialEntryUseCase(financialEntryRepository);
    }

    return this.createFinancialEntryUseCase;
  }
}

// infrastructure/di/Container.ts
import { LoginUseCase } from "../../domain/usercases/LoginUseCase";
import { LoginWithGoogleUseCase } from "../../domain/usercases/LoginWithGoogleUseCase";
import { AuthRepositoryImpl } from "../../domain/data/repositories/AuthRepositoryImpl";
import { AuthApi } from "../services/Auth.api";
import { RegisterUseCase } from "../../domain/usercases/signup/RegisterUseCase";
import { RegisterRepositoryImpl } from "../../domain/data/repositories/RegisterRepositoryImpl";
import { RegisterApi } from "../services/Register.api";

// Bet Streak imports
import { BetCheckInUseCase } from "../../domain/usercases/BetCheckInUseCase";
import { GetBetStreakStatusUseCase } from "../../domain/usercases/GetBetStreakStatusUseCase";
import { ResetBetStreakUseCase } from "../../domain/usercases/ResetBetStreakUseCase";
import { BetStreakRepositoryImpl } from "../../domain/data/repositories/BetStreakRepositoryImpl";
import { BetStreakApi } from "../services/BetStreak.api";

// Financial imports
import { GetFinancialCategoriesUseCase } from "../../domain/usercases/GetFinancialCategoriesUseCase";
import { GetFinancialEntriesUseCase } from "../../domain/usercases/GetFinancialEntriesUseCase";
import { CreateFinancialEntryUseCase } from "../../domain/usercases/CreateFinancialEntryUseCase";
import { FinancialCategoryRepositoryImpl } from "../../domain/data/repositories/FinancialCategoryRepositoryImpl";
import { FinancialEntryRepositoryImpl } from "../../domain/data/repositories/FinancialEntryRepositoryImpl";
import { FinancialCategoryApi } from "../services/FinancialCategory.api";
import { FinancialEntryApi } from "../services/FinancialEntry.api";

// User profile imports
import { GetCurrentUserUseCase } from "../../domain/usercases/GetCurrentUserUseCase";
import { LoadDashboardUseCase } from "../../domain/usercases/LoadDashboardUseCase";
import { UserRepositoryImpl } from "../../domain/data/repositories/UserRepositoryImpl";
import { UserApi } from "../services/User.api";

// Courses imports
import { GetCoursesWithProgressUseCase } from "../../domain/usercases/GetCoursesWithProgressUseCase";
import { CourseRepositoryImpl } from "../../domain/data/repositories/CourseRepositoryImpl";
import { CourseApi } from "../services/Course.api";

// Password change (esqueci a senha) imports
import { RequestPasswordChangeUseCase } from "../../domain/usercases/RequestPasswordChangeUseCase";
import { VerifyPasswordChangeCodeUseCase } from "../../domain/usercases/VerifyPasswordChangeCodeUseCase";
import { ConfirmPasswordChangeUseCase } from "../../domain/usercases/ConfirmPasswordChangeUseCase";

export class Container {
  private static instance: Container;

  private loginUseCase: LoginUseCase | null = null;
  private loginWithGoogleUseCase: LoginWithGoogleUseCase | null = null;
  private registerUseCase: RegisterUseCase | null = null;

  // Bet Streak use cases
  private betCheckInUseCase: BetCheckInUseCase | null = null;
  private getBetStreakStatusUseCase: GetBetStreakStatusUseCase | null = null;
  private resetBetStreakUseCase: ResetBetStreakUseCase | null = null;

  // Financial use cases
  private getFinancialCategoriesUseCase: GetFinancialCategoriesUseCase | null = null;
  private getFinancialEntriesUseCase: GetFinancialEntriesUseCase | null = null;
  private createFinancialEntryUseCase: CreateFinancialEntryUseCase | null = null;

  // User profile
  private getCurrentUserUseCase: GetCurrentUserUseCase | null = null;
  private loadDashboardUseCase: LoadDashboardUseCase | null = null;

  private getCoursesWithProgressUseCase: GetCoursesWithProgressUseCase | null = null;

  // Password change (esqueci a senha)
  private requestPasswordChangeUseCase: RequestPasswordChangeUseCase | null = null;
  private verifyPasswordChangeCodeUseCase: VerifyPasswordChangeCodeUseCase | null = null;
  private confirmPasswordChangeUseCase: ConfirmPasswordChangeUseCase | null = null;

  private authApi: AuthApi | null = null;
  private authRepository: AuthRepositoryImpl | null = null;

  private ensureAuthDependencies(): void {
    if (!this.authApi) {
      this.authApi = new AuthApi();
      this.authRepository = new AuthRepositoryImpl(this.authApi);
    }
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  getLoginUseCase(): LoginUseCase {
    this.ensureAuthDependencies();
    if (!this.loginUseCase) {
      this.loginUseCase = new LoginUseCase(this.authRepository!);
    }

    return this.loginUseCase;
  }

  getLoginWithGoogleUseCase(): LoginWithGoogleUseCase {
    this.ensureAuthDependencies();
    if (!this.loginWithGoogleUseCase) {
      this.loginWithGoogleUseCase = new LoginWithGoogleUseCase(this.authRepository!);
    }
    return this.loginWithGoogleUseCase;
  }

  getRegisterUseCase(): RegisterUseCase {
    if (!this.registerUseCase) {
      const registerApi = new RegisterApi();
      const registerRepository = new RegisterRepositoryImpl(registerApi);
      this.registerUseCase = new RegisterUseCase(registerRepository);
    }

    return this.registerUseCase;
  }

  // Bet Streak use cases
  getGetBetStreakStatusUseCase(): GetBetStreakStatusUseCase {
    if (!this.getBetStreakStatusUseCase) {
      const betStreakApi = new BetStreakApi();
      const betStreakRepository = new BetStreakRepositoryImpl(betStreakApi);
      this.getBetStreakStatusUseCase = new GetBetStreakStatusUseCase(betStreakRepository);
    }

    return this.getBetStreakStatusUseCase;
  }

  getBetCheckInUseCase(): BetCheckInUseCase {
    if (!this.betCheckInUseCase) {
      const betStreakApi = new BetStreakApi();
      const betStreakRepository = new BetStreakRepositoryImpl(betStreakApi);
      this.betCheckInUseCase = new BetCheckInUseCase(betStreakRepository);
    }

    return this.betCheckInUseCase;
  }

  getResetBetStreakUseCase(): ResetBetStreakUseCase {
    if (!this.resetBetStreakUseCase) {
      const betStreakApi = new BetStreakApi();
      const betStreakRepository = new BetStreakRepositoryImpl(betStreakApi);
      this.resetBetStreakUseCase = new ResetBetStreakUseCase(betStreakRepository);
    }

    return this.resetBetStreakUseCase;
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

  getGetCurrentUserUseCase(): GetCurrentUserUseCase {
    if (!this.getCurrentUserUseCase) {
      const userApi = new UserApi();
      const userRepository = new UserRepositoryImpl(userApi);
      this.getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
    }

    return this.getCurrentUserUseCase;
  }

  getLoadDashboardUseCase(): LoadDashboardUseCase {
    if (!this.loadDashboardUseCase) {
      const userApi = new UserApi();
      const userRepository = new UserRepositoryImpl(userApi);
      this.loadDashboardUseCase = new LoadDashboardUseCase(userRepository);
    }
    return this.loadDashboardUseCase;
  }

  getGetCoursesWithProgressUseCase(): GetCoursesWithProgressUseCase {
    if (!this.getCoursesWithProgressUseCase) {
      const courseApi = new CourseApi();
      const courseRepository = new CourseRepositoryImpl(courseApi);
      this.getCoursesWithProgressUseCase = new GetCoursesWithProgressUseCase(courseRepository);
    }
    return this.getCoursesWithProgressUseCase;
  }

  getRequestPasswordChangeUseCase(): RequestPasswordChangeUseCase {
    this.ensureAuthDependencies();
    if (!this.requestPasswordChangeUseCase) {
      this.requestPasswordChangeUseCase = new RequestPasswordChangeUseCase(this.authRepository!);
    }
    return this.requestPasswordChangeUseCase;
  }

  getVerifyPasswordChangeCodeUseCase(): VerifyPasswordChangeCodeUseCase {
    this.ensureAuthDependencies();
    if (!this.verifyPasswordChangeCodeUseCase) {
      this.verifyPasswordChangeCodeUseCase = new VerifyPasswordChangeCodeUseCase(this.authRepository!);
    }
    return this.verifyPasswordChangeCodeUseCase;
  }

  getConfirmPasswordChangeUseCase(): ConfirmPasswordChangeUseCase {
    this.ensureAuthDependencies();
    if (!this.confirmPasswordChangeUseCase) {
      this.confirmPasswordChangeUseCase = new ConfirmPasswordChangeUseCase(this.authRepository!);
    }
    return this.confirmPasswordChangeUseCase;
  }
}

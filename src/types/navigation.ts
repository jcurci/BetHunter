import { NavigationProp as RNNavigationProp } from '@react-navigation/native';

export type RootStackParamList = {
  OnboardingFlow: { startAtStep?: string } | undefined;
  Login: undefined;
  SignUpName: undefined;
  SignUpContact: { name: string; username: string };
  SignUpPassword: { name: string; username: string; email: string; phone: string };
  PasswordResetMethod: undefined;
  PasswordResetEmail: { method: 'email' | 'username' | 'phone' };
  PasswordResetVerification: { method: 'email' | 'username' | 'phone'; value: string };
  PasswordResetNewPassword: { method: 'email' | 'username' | 'phone'; value: string; code: string };
  Home: { openBlockFlow?: boolean };
  Roulette: undefined;
  MenuEducacional: undefined;
  Cursos: undefined;
  CourseModules: { courseId: string; courseTitle: string; modulesCompleted: number };
  Ranking: undefined;
  Quiz: { moduleId: string; moduleTitle: string };
  MaterialReader: { moduleId: string; moduleTitle: string };
  QuizResult: { score: number; total: number; stars?: number; accuracy?: number };
  Graficos: undefined;
  Config: undefined;
  Profile: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  AccountOverview: undefined;
  AccountHistory: undefined;
  TransactionForm: { type: 'income' | 'expense' };
  EmConstrucao: undefined;
  Acessor: undefined;
  HistoryList: undefined;
  MinhaJornada: undefined;
  CursosSalvos: undefined;
  Meditacao: undefined;
  PersonalityTestIntro: undefined;
  PersonalityTestQuestion: undefined;
  MinhaConta: undefined;
  SobreNos: undefined;
  SejaParceiro: undefined;
  DetalhesPessoais: undefined;
  CustomerCenter: undefined;
  Paywall: undefined;
};

export type NavigationProp = RNNavigationProp<RootStackParamList>;

export type RouteProp<T extends keyof RootStackParamList> = {
  params: RootStackParamList[T];
};

import { NavigationProp as RNNavigationProp } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  SignUpName: undefined;
  SignUpContact: { name: string; username: string };
  SignUpVerification: { name: string; username: string; email: string; phone: string };
  SignUpPassword: { name: string; username: string; email: string; phone: string };
  PasswordResetMethod: undefined;
  PasswordResetEmail: { method: 'email' | 'username' | 'phone' };
  PasswordResetVerification: { method: 'email' | 'username' | 'phone'; value: string };
  PasswordResetNewPassword: { method: 'email' | 'username' | 'phone'; value: string; code: string };
  Home: undefined;
  Roulette: undefined;
  MenuEducacional: undefined;
  Cursos: undefined;
  Ranking: undefined;
  Quiz: { title: string; moduleData: any };
  QuizResult: { score: number; total: number };
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
  PersonalityTestIntro: undefined;
  PersonalityTestQuestion: undefined;
  MinhaJornada: undefined;
  CursosSalvos: undefined;
  Meditacao: undefined;
  PersonalityTestIntro: undefined;
  PersonalityTestQuestion: undefined;
  MinhaConta: undefined;
  DetalhesPessoais: undefined;
  PersonalityTestIntro: undefined;
  PersonalityTestQuestion: undefined;
};

export type NavigationProp = RNNavigationProp<RootStackParamList>;

export type RouteProp<T extends keyof RootStackParamList> = {
  params: RootStackParamList[T];
};

import { NavigationProp as RNNavigationProp } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  SiginUp: undefined;
  SignUpPassword: { name: string; email: string; phone: string };
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
};

export type NavigationProp = RNNavigationProp<RootStackParamList>;

export type RouteProp<T extends keyof RootStackParamList> = {
  params: RootStackParamList[T];
};

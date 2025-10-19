import { NavigationProp as RNNavigationProp } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  SiginUp: undefined;
  Home: undefined;
  Roulette: undefined;
  Aprender: undefined;
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
};

export type NavigationProp = RNNavigationProp<RootStackParamList>;

export type RouteProp<T extends keyof RootStackParamList> = {
  params: RootStackParamList[T];
};

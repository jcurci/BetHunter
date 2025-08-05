export type RootStackParamList = {
  MainTabs: undefined;
  Config: undefined;
  Profile: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SiginUp: undefined;
};

export type TabParamList = {
  Home: undefined;
  Aprender: undefined;
  Gráficos: undefined;
  Jogar: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList, AuthStackParamList {}
  }
} 